import {
  BulletAnimation,
  DamageAnimation,
  KnockBackAnimation,
  useAnimations,
} from '@/stores/animations';
import { TURN, useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import {
  coordsEqual,
  coordsInViewCone,
  Cover,
  coverMultiplierBetween,
  Dir,
  DIRS,
  dirsBetween,
  distance,
  FlankingDir,
  flankingDirBetween,
  rotateDir,
} from '@/utils/map';
import type { Power } from '@/powers/power';
import { random } from '@/utils/random';
import { Actor } from '../actor';
import { isDamageable, type Damageable } from '../damageable';
import { weaponIsGun } from '../weapons/gun';
import type { AsciiDrawable } from '@/utils/types';
import MapEntity, { EntityLayer } from '../map-entity';
import type { StatusEffect } from '@/status-effects/status-effect';
import { isTrap } from '../traps/trap';
import type { Item } from '../items/item';
import type { Weapon, WeaponData } from '../weapons/weapon';
import { Pipe } from '../weapons/melee-weapon';
import { debugOptions } from '@/utils/debug-options';
import { TargetingArray } from '@/status-effects/targeting-array';
import {
  atRadLevelOrHigher,
  RadLevel,
  radLevelFromRads,
} from '@/utils/radiation';
import type { Door } from '../terrain';
import type { Interactable } from '../interactable';

export type Covers = Record<Dir, Cover>;

const dirChars: Record<Dir, string> = {
  [Dir.Up]: '↑',
  [Dir.Right]: '→',
  [Dir.Down]: '↓',
  [Dir.Left]: '←',
};

const flankingDirBonusMultipliers: Record<FlankingDir, number> = {
  [FlankingDir.Front]: 0,
  [FlankingDir.Side]: 1,
  [FlankingDir.Back]: 2,
};

export enum CreatureAlignment {
  Ally = 'ally',
  Enemy = 'enemy',
}

export function isCreature(entity: MapEntity): entity is Creature {
  return entity instanceof Creature;
}

export default abstract class Creature
  extends Actor
  implements Damageable, AsciiDrawable
{
  constructor(tile: Tile) {
    super(tile);
    this.updateLastSawPlayerIfCanSee();
  }

  readonly IMPLEMENTS_DAMAGEABLE = true;

  abstract readonly name: string;
  abstract readonly defaultChar: string;

  layer = EntityLayer.Creature;

  health = 100;
  maxHealth = 100;

  alignment = CreatureAlignment.Enemy;

  energy = 100;
  maxEnergy = 100;

  baseEnergyRechargePerTick = 0.1;

  baseMoveTime = 2 * TURN;
  attackTime = 2 * TURN;
  reloadTime = 4 * TURN;

  penetrationBlock = 1;

  baseViewRange = 10;

  get moveTime() {
    let moveTime = this.baseMoveTime;

    if (this.atRadLevelOrHigher(RadLevel.Extreme)) {
      moveTime *= 3;
    } else if (this.atRadLevelOrHigher(RadLevel.High)) {
      moveTime *= 2;
    }

    return moveTime;
  }

  get turnTime() {
    return this.moveTime;
  }

  get energyRechargePerTick() {
    if (this.atRadLevelOrHigher(RadLevel.Extreme)) {
      return 0;
    }

    return this.baseEnergyRechargePerTick;
  }

  get viewRange() {
    let range = this.baseViewRange;

    if (this.atRadLevelOrHigher(RadLevel.Low)) {
      range -= 2;
    }

    return Math.max(range, 0);
  }

  baseAccuracyMultiplier = 1;

  rads = 0;
  radsLostPerTick = 1 / TURN;

  get accuracyMultiplier() {
    if (this.hasStatusEffect(TargetingArray)) {
      return Infinity;
    }

    let acc = this.baseAccuracyMultiplier;

    if (this.atRadLevelOrHigher(RadLevel.Medium)) {
      acc *= 0.5;
    }

    return acc;
  }

  evasionMultiplier = 1;

  unarmedAttackData: WeaponData = {
    damage: 1,
    accuracy: Infinity,
    attackTimeMultiplier: 1,
    knockBack: 0,
    flankingBonus: 0,
  };

  blocksMovement = true;
  blocksView = false;

  facing: Dir = random.arrayElement([Dir.Up, Dir.Right, Dir.Down, Dir.Left]);
  viewAngle: number = 90;

  inventory: Item[] = [new Pipe()];
  equippedWeapon: Weapon | null = null;

  get weaponData() {
    return this.equippedWeapon ?? this.unarmedAttackData;
  }

  powers: Power[] = [];
  selectedPower: Power | null = null;

  statusEffects: StatusEffect[] = [];

  lastSawPlayerAt: Coords | null = null;

  get char() {
    return this.game.directionViewMode
      ? dirChars[this.facing]
      : this.defaultChar;
  }

  abstract readonly color: string;

  get game() {
    return useGame();
  }

  get animationsStore() {
    return useAnimations();
  }

  get radLevel(): RadLevel {
    return radLevelFromRads(this.rads);
  }

  move(tile: Tile) {
    if (!this.canAct) return;

    this.updatePosition(tile);

    this.timeUntilNextAction =
      this.moveTime * (tile.moveTimeMultiplier as number);
  }

  turn(dir: Dir) {
    if (!this.canAct || dir === this.facing) return;

    this.updateFacing(dir);

    this.timeUntilNextAction = this.turnTime;
  }

  reload() {
    if (!this.equippedWeapon || !weaponIsGun(this.equippedWeapon)) return;

    if (this.equippedWeapon.amoLoaded === this.equippedWeapon.clipSize) return;

    this.equippedWeapon.amoLoaded = this.equippedWeapon.clipSize;

    this.timeUntilNextAction =
      this.reloadTime * this.equippedWeapon.reloadTimeMultiplier;
  }

  fireWeapon(entities: (Damageable & Coords)[]) {
    if (!this.canAct) return;
    if (this.mustReload) return;

    entities.forEach((entity, idx) => {
      const hitChance = this.hitChanceForDamageable(entity);

      const willHit = random.float(0, 1) < hitChance;

      let damage = this.weaponData.damage;

      if (willHit) {
        if (this.weaponData.knockBack && entity instanceof Creature) {
          const dirs = dirsBetween(this, entity);
          const dir = random.arrayElement(dirs);
          entity.receiveKnockBack(
            this.weaponData.damage,
            this.weaponData.knockBack,
            dir
          );
        }

        if (entity instanceof Creature && this.weaponData.flankingBonus) {
          const flankingDir = flankingDirBetween(this, entity, entity.facing);
          const bonusMultiplier = flankingDirBonusMultipliers[flankingDir];

          damage += damage * this.weaponData.flankingBonus * bonusMultiplier;
        }

        entity.receiveDamage(damage);
      }

      if (
        idx === 0 &&
        this.equippedWeapon &&
        weaponIsGun(this.equippedWeapon)
      ) {
        this.game.animations.addAnimation(
          new BulletAnimation(this, entity, willHit)
        );
      }
    });

    if (this.equippedWeapon && weaponIsGun(this.equippedWeapon)) {
      this.equippedWeapon.amoLoaded--;

      if (entities.length === 0) {
        this.game.animations.addAnimation(
          new BulletAnimation(this, this.game.selectedTile as Coords, false)
        );
      }
    }

    this.timeUntilNextAction =
      this.attackTime * this.weaponData.attackTimeMultiplier;
  }

  useSelectedPower() {
    if (!this.selectedPower) return;
    if (this.selectedPower.energyCost > this.energy) return;

    if (this.selectedPower.activate()) {
      this.energy -= this.selectedPower.energyCost;
      this.timeUntilNextAction = this.selectedPower.useTime;
      return true;
    }
  }

  interact(entity: Interactable) {
    if (!entity.isCurrentlyInteractable) return;

    entity.onInteract();
    this.timeUntilNextAction = this.moveTime;
  }

  closeDoor(door: Door) {
    if (door.canClose) {
      door.close();

      this.timeUntilNextAction = this.moveTime;
    }
  }

  receiveDamage(damage: number) {
    this.health = Math.max(this.health - damage, 0);

    if (this.game.coordsVisible(this)) {
      const animation = new DamageAnimation(this);
      this.animationsStore.addAnimation(animation);
    }
  }

  get canAct() {
    return this.timeUntilNextAction === 0 && !this.isDead;
  }

  get isDead() {
    return this.health <= 0;
  }

  get isCurrentlyDamageable() {
    return this.health > 0;
  }

  moveOrTurn(tile: Tile) {
    const dirs = dirsBetween(this, tile);

    if (dirs.includes(this.facing)) {
      this.move(tile);
    } else {
      this.turn(dirs[0]);
    }
  }

  get canAttackPlayer() {
    if (!this.canSeePlayer) return false;
    const dist = distance(this, this.game.player);

    const range =
      this.equippedWeapon && weaponIsGun(this.equippedWeapon)
        ? this.equippedWeapon.range
        : 1;

    if (dist > range) return false;

    const tilesBetween = this.game.map
      .tilesBetween(this, this.game.player)
      .slice(1, -1);

    const aimIsBlocked = tilesBetween.some((tile) =>
      tile.entities.some((e) => isDamageable(e) && e.penetrationBlock > 0)
    );

    return !aimIsBlocked;
  }

  get canSeePlayer() {
    if (distance(this, this.game.player) > this.viewRange) return false;

    if (!coordsInViewCone(this, this.game.player, this.viewAngle, this.facing))
      return false;

    // See if view is blocked by a wall
    const tilesBetween = this.game.map.tilesBetween(this, this.game.player);

    if (tilesBetween.some((tile) => tile.hasEntityThatBlocksView)) return false;

    return true;
  }

  get covers(): Record<Dir, Cover> {
    return DIRS.reduce((acc, dir) => {
      acc[dir] = this.coverInDirection(dir);
      return acc;
    }, {} as Record<Dir, Cover>);
  }

  coverInDirection(dir: Dir) {
    return this.game.map.adjacentTile(this, dir)?.cover ?? Cover.None;
  }

  // // The chance that a shot fired from this actor at "damageable" will hit
  // // Returns a number between 0 and 1 inclusive
  hitChanceForDamageable(damageable: Damageable & Coords) {
    if (damageable.evasionMultiplier === undefined) {
      return 1;
    }

    const actor: Creature = damageable as Creature;

    const baselineAccuracy =
      this.accuracyMultiplier *
      this.weaponData.accuracy *
      actor.evasionMultiplier;

    return baselineAccuracy * actor.coverMultiplierWhenShotFrom(this);
  }

  coverMultiplierWhenShotFrom(from: Coords) {
    return coverMultiplierBetween(this, from, this.covers);
  }

  receiveKnockBack(damage: number, amount: number, dir: Dir) {
    let toCoords: Coords = this;
    let additionalActorDamaged: Creature | null = null;
    let hitWall = false;

    const tilesMovedThrough: Tile[] = [];

    for (let i = 0; i < amount; i++) {
      const next = this.game.map.adjacentTile(toCoords, dir);

      if (!next) {
        break;
      }

      const actor = this.game.creatureAt(next);

      if (actor) {
        additionalActorDamaged = actor;
        break;
      }

      if (next.hasEntityThatBlocksMovement) {
        hitWall = true;
        break;
      }

      tilesMovedThrough.push(next);

      toCoords = next;
    }

    if (additionalActorDamaged) {
      additionalActorDamaged.receiveDamage(damage * 0.25);
    }

    if (hitWall) {
      this.receiveDamage(damage * 0.25);
    }

    this.game.animations.addAnimation(
      new KnockBackAnimation(
        this,
        this.coords,
        toCoords,
        !!(hitWall || additionalActorDamaged)
      )
    );

    // Trigger any traps in tiles moved through
    tilesMovedThrough.forEach((tile) => {
      tile.entities.forEach((entity) => {
        if (isTrap(entity)) {
          entity.trigger();
        }
      });
    });

    const tile = this.game.map.tileAt(toCoords);

    this.updatePosition(tile);
  }

  get shouldRemoveFromGame() {
    return this.isDead;
  }

  get mustReload() {
    return (
      this.equippedWeapon &&
      weaponIsGun(this.equippedWeapon) &&
      this.equippedWeapon.amoLoaded === 0
    );
  }

  tick() {
    super.tick();

    this.energy = Math.min(
      this.maxEnergy,
      this.energy + this.energyRechargePerTick
    );

    this.rads = Math.max(0, this.rads - this.radsLostPerTick);

    this.statusEffects.forEach((effect) => {
      effect.tick();
    });

    if (this.atRadLevelOrHigher(RadLevel.Extreme)) {
      const damagePerTurn = this.maxHealth * 0.02;
      const damagePerTick = damagePerTurn / TURN;
      this.receiveDamage(damagePerTick);
    } else if (this.atRadLevelOrHigher(RadLevel.High)) {
      const damagePerTurn = this.maxHealth * 0.02;
      const damagePerTick = damagePerTurn / TURN;
      this.receiveDamage(damagePerTick);
    }
  }

  addStatusEffect(statusEffect: StatusEffect) {
    // If the creature already has the status effect, just set its duration to 0
    const existingStatusEffect = this.statusEffects.find(
      (effect) => effect.name === statusEffect.name
    );

    if (existingStatusEffect) {
      existingStatusEffect.currentDuration = 0;
    } else {
      this.statusEffects.push(statusEffect);
    }
  }

  removeStatusEffect(statusEffect: StatusEffect) {
    const effects = this.statusEffects;
    const idx = effects.indexOf(statusEffect);

    if (idx === -1) {
      return;
    }

    effects.splice(idx, 1);

    this.statusEffects = [...effects];
  }

  // Pass the actual status effect class
  // i.e. hasStatusEffect(TargetingArray)
  hasStatusEffect(statusEffect: Function) {
    return this.statusEffects.some((e) => e instanceof statusEffect);
  }

  _act() {
    if (debugOptions.docileEnemies) return;

    if (debugOptions.wanderingEnemies) return this._wander();

    if (this.alignment === CreatureAlignment.Enemy) {
      this._actHostile();
    }
  }

  /**
   * If gun is empty, reload
   * else if I can attack the player, attack the player
   * else if I can see the player, move towards the player
   * else if I last saw the player somewhere
   *  If I'm on the tile I last saw them at, turn randomly (look around)
   *  else, move towards where I last saw them
   * else wander
   */
  _actHostile() {
    if (this.mustReload) {
      this.reload();
    } else if (this.canAttackPlayer) {
      this.fireWeapon([this.game.player]);
    } else if (this.canSeePlayer) {
      this._moveTowards(this.game.player);
    } else if (this.lastSawPlayerAt) {
      if (coordsEqual(this, this.lastSawPlayerAt)) {
        const randomTurnSegmentCount = random.polarity();
        const dir = rotateDir(this.facing, randomTurnSegmentCount);
        this.turn(dir);
      } else {
        this._moveTowards(this.lastSawPlayerAt);
      }
    } else {
      this._wander();
    }
  }

  _moveTowards(coords: Coords) {
    const coordsPath = this.game.map.pathBetween(this.coords, coords, this);

    const coordsTowardsTarget = coordsPath[0];

    if (!coordsTowardsTarget) return;

    const tile = this.game.map.tileAt(coordsTowardsTarget);

    if (!this.game.creatureCanOccupy(tile)) return;

    this.moveOrTurn(tile);
  }

  _wander() {
    const adjacentCoords = [
      { x: this.x - 1, y: this.y },
      { x: this.x + 1, y: this.y },
      { x: this.x, y: this.y - 1 },
      { x: this.x, y: this.y + 1 },
    ];

    const tiles = adjacentCoords
      .map((coords) => this.game.map.tileAt(coords))
      .filter((tile) => {
        return tile && this.game.creatureCanOccupy(tile);
      });

    if (tiles.length === 0) return;

    this.moveOrTurn(random.arrayElement(tiles));
  }

  updatePosition(tile: Tile) {
    super.updatePosition(tile);
    this.updateLastSawPlayerIfCanSee();
  }

  updateFacing(dir: Dir) {
    this.facing = dir;
    this.updateLastSawPlayerIfCanSee();
  }

  updateLastSawPlayerIfCanSee() {
    if (this.canSeePlayer) {
      this.lastSawPlayerAt = this.game.player.coords;
    }
  }

  atRadLevelOrHigher(level: RadLevel) {
    return atRadLevelOrHigher(this.rads, level);
  }

  receiveRadiation(amount: number) {
    this.rads += amount;
  }
}
