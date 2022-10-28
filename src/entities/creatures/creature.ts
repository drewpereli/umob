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
import { Actor, actorCache } from '../actor';
import type { Damageable } from '../damageable';
import Gun, { damageablesAimedAt, weaponIsGun } from '../weapons/gun';
import type { AsciiDrawable } from '@/utils/types';
import MapEntity, { EntityLayer } from '../map-entity';
import type { StatusEffect } from '@/status-effects/status-effect';
import { isTrap } from '../traps/trap';
import type { Item } from '../items/item';
import { DamageType, type Weapon, type WeaponData } from '../weapons/weapon';
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
  WithPlayer = 'with-layer',
  AgainstPlayer = 'against-player',
}

export function isCreature(entity: MapEntity): entity is Creature {
  return entity instanceof Creature;
}

enum AiState {
  Engaging = 'engaging',
  Searching = 'searching',
  Idle = 'idle',
}

export enum Resistance {
  VeryVulnerable = 'very-vulnerable',
  Vulnerable = 'vulnerable',
  None = 'none',
  Resistant = 'resistant',
  Immune = 'immune',
}

const resistanceMultipliers: Record<Resistance, number> = {
  [Resistance.VeryVulnerable]: 2,
  [Resistance.Vulnerable]: 1.5,
  [Resistance.None]: 1,
  [Resistance.Resistant]: 0.5,
  [Resistance.Immune]: 0,
};

export default abstract class Creature
  extends Actor
  implements Damageable, AsciiDrawable
{
  constructor(tile: Tile, public alignment = CreatureAlignment.AgainstPlayer) {
    super(tile);
    this.updateLastSawEnemy();
  }

  /* #region  Damageable */
  receiveDamage(damage: number, type: DamageType) {
    damage *= this.resistanceMultiplierForDamageType(type);

    if (damage <= 0) return;

    this.health = Math.max(this.health - damage, 0);

    if (this.game.coordsVisible(this)) {
      const animation = new DamageAnimation(this);
      this.animationsStore.addAnimation(animation);
    }
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
      additionalActorDamaged.receiveDamage(damage * 0.25, DamageType.Physical);
    }

    if (hitWall) {
      this.receiveDamage(damage * 0.25, DamageType.Physical);
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

  get isCurrentlyDamageable() {
    return this.health > 0;
  }

  evasionMultiplier = 1;

  penetrationBlock = 1;

  readonly IMPLEMENTS_DAMAGEABLE = true;
  /* #endregion */

  /* #region  AsciiDrawable */
  abstract readonly name: string;
  abstract readonly defaultChar: string;

  get char() {
    return this.game.directionViewMode
      ? dirChars[this.facing]
      : this.defaultChar;
  }

  abstract readonly color: string;
  /* #endregion */

  /* #region  MapEntity */
  layer = EntityLayer.Creature;
  blocksMovement = true;
  blocksView = false;

  get shouldRemoveFromGame() {
    return this.isDead;
  }

  updatePosition(tile: Tile) {
    super.updatePosition(tile);
    this.updateLastSawEnemy();
  }
  /* #endregion */

  /* #region  Base Attributes */
  maxHealth = 100;
  maxEnergy = 100;

  baseEnergyRechargePerTick = 0.1;

  baseMoveTime = 2 * TURN;
  attackTime = 2 * TURN;
  reloadTime = 4 * TURN;

  baseViewRange = 10;

  baseAccuracyMultiplier = 1;

  viewAngle: number = 90;

  resistances: Partial<Record<DamageType, Resistance>> = {};

  resistanceMultiplierForDamageType(type: DamageType) {
    const resistance = this.resistances[type] ?? Resistance.None;
    return resistanceMultipliers[resistance];
  }
  /* #endregion */

  /* #region  Computed Attributes */
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

  get covers(): Record<Dir, Cover> {
    return DIRS.reduce((acc, dir) => {
      acc[dir] = this.coverInDirection(dir);
      return acc;
    }, {} as Record<Dir, Cover>);
  }

  coverInDirection(dir: Dir) {
    return this.game.map.adjacentTile(this, dir)?.cover ?? Cover.None;
  }

  coverMultiplierWhenShotFrom(from: Coords) {
    return coverMultiplierBetween(this, from, this.covers);
  }
  /* #endregion */

  /* #region  weapon and attack stats */
  equippedWeapon: Weapon | null = null;

  unarmedAttackData: WeaponData = {
    damage: 1,
    accuracy: Infinity,
    attackTimeMultiplier: 1,
    knockBack: 0,
    flankingBonus: 0,
    damageType: DamageType.Physical,
  };

  get weaponData() {
    return this.equippedWeapon ?? this.unarmedAttackData;
  }

  get mustReload() {
    return (
      this.equippedWeapon &&
      weaponIsGun(this.equippedWeapon) &&
      this.equippedWeapon.amoLoaded === 0
    );
  }

  // The chance that a shot fired from this actor at "damageable" will hit
  // Returns a number between 0 and 1 inclusive
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
  /* #endregion */

  /* #region  status effects and radiation */
  rads = 0;
  radsLostPerTick = 1 / TURN;

  get radLevel(): RadLevel {
    return radLevelFromRads(this.rads);
  }

  atRadLevelOrHigher(level: RadLevel) {
    return atRadLevelOrHigher(this.rads, level);
  }

  receiveRadiation(amount: number) {
    amount *= this.resistanceMultiplierForDamageType(DamageType.Radiation);

    this.rads += amount;
  }

  statusEffects: StatusEffect[] = [];

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
  /* #endregion */

  /* #region  AI */
  aiState = AiState.Idle;
  timeSpentInAiState = 0;

  lastSawEnemyAt: Coords | null = null;

  @actorCache('act')
  get attackableEnemies() {
    const enemies = this.enemiesSeen;

    const gun =
      this.equippedWeapon && weaponIsGun(this.equippedWeapon)
        ? this.equippedWeapon
        : null;

    const range = gun?.range ?? 1;

    const enemiesInRange = enemies.filter(
      (enemy) => distance(this, enemy) <= range
    );

    if (!gun) {
      return enemiesInRange;
    }

    return enemiesInRange.filter((enemy) => {
      const damageablesAimedAtIfAimingAtEnemy = damageablesAimedAt(
        this.tile,
        enemy.tile,
        gun
      );

      return damageablesAimedAtIfAimingAtEnemy.includes(enemy);
    });
  }

  @actorCache('tick')
  get enemiesSeen() {
    const enemies = this.oppositeAlignedCreatures;

    return enemies.filter((enemy) => {
      if (distance(this, enemy) > this.viewRange) return false;

      if (!coordsInViewCone(this, enemy, this.viewAngle, this.facing))
        return false;

      const tilesBetween = this.game.map.tilesBetween(this, this.game.player);

      if (tilesBetween.some((tile) => tile.hasEntityThatBlocksView))
        return false;

      return true;
    });
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

  // Assumes the tile is in range
  _fireEquippedGun(tile: Tile) {
    const gun = this.equippedWeapon as Gun;

    const damageables = damageablesAimedAt(this.tile, tile, gun);

    const hit = this._attemptAttackAttackableDamageables(damageables);

    this.game.animations.addAnimation(
      new BulletAnimation(this, tile, hit.length > 0)
    );

    gun.amoLoaded--;
  }

  // Assumes the tile is in range
  _meleeAttackTile(tile: Tile) {
    this._attemptAttackAttackableDamageables(tile.damageables);
  }

  // Assumes we can act
  // Assumes we don't have to reload
  // Assumes we can attack "damageables"
  // Process damage/knockback on damageables
  // Updates timeUntilNextAction
  // Returns the damageables we hit
  _attemptAttackAttackableDamageables(damageables: Damageable[]) {
    const weaponData = this.weaponData;

    const hit: Damageable[] = [];

    damageables.forEach((entity) => {
      const hitChance = this.hitChanceForDamageable(entity);

      const willHit = random.float(0, 1) < hitChance;

      let damage = weaponData.damage;

      if (willHit) {
        if (weaponData.knockBack && entity instanceof Creature) {
          const dirs = dirsBetween(this, entity);
          const dir = random.arrayElement(dirs);
          entity.receiveKnockBack(weaponData.damage, weaponData.knockBack, dir);
        }

        if (entity instanceof Creature && weaponData.flankingBonus) {
          const flankingDir = flankingDirBetween(this, entity, entity.facing);
          const bonusMultiplier = flankingDirBonusMultipliers[flankingDir];

          damage += damage * weaponData.flankingBonus * bonusMultiplier;
        }

        entity.receiveDamage(damage, weaponData.damageType);

        hit.push(entity);
      }
    });

    this.timeUntilNextAction =
      this.attackTime * weaponData.attackTimeMultiplier;

    return hit;
  }

  setAiState(newState: AiState) {
    if (newState === this.aiState) return;

    const oldState = this.aiState;

    if (oldState === AiState.Searching && newState === AiState.Idle) {
      this.lastSawEnemyAt = null;
    }

    this.aiState = newState;

    console.log(`Updating state to ${newState}`);

    this.timeSpentInAiState = 0;
  }

  updateLastSawEnemy() {
    const enemy = this.enemiesSeen[0];
    if (enemy) {
      this.lastSawEnemyAt = enemy.coords;
    }
  }

  get oppositeAlignment() {
    return this.alignment === CreatureAlignment.AgainstPlayer
      ? CreatureAlignment.WithPlayer
      : CreatureAlignment.AgainstPlayer;
  }

  get oppositeAlignedCreatures(): Creature[] {
    return this.game.creaturesByAlignment[this.oppositeAlignment];
  }

  _updateAiStateIfNeeded() {
    const visibleEnemy = this.enemiesSeen[0];

    if (visibleEnemy) {
      this.setAiState(AiState.Engaging);
      return;
    }

    if (this.lastSawEnemyAt) {
      this.setAiState(AiState.Searching);

      if (this.timeSpentInAiState > 10 * TURN) {
        this.setAiState(AiState.Idle);
      }

      return;
    }

    this.setAiState(AiState.Idle);
  }

  _aiStateActions: Record<AiState, () => void> = {
    [AiState.Engaging]: () => {
      const attackableEnemy = this.attackableEnemies[0];
      const visibleEnemy = this.enemiesSeen[0];

      if (this.mustReload) {
        this.reload();
      } else if (attackableEnemy) {
        this.attackTile(attackableEnemy.tile);
      } else if (visibleEnemy) {
        this._moveTowards(visibleEnemy);
      }
    },
    [AiState.Searching]: () => {
      if (coordsEqual(this.lastSawEnemyAt as Coords, this)) {
        const randomTurnSegmentCount = random.polarity();
        const dir = rotateDir(this.facing, randomTurnSegmentCount);
        this.turn(dir);
      } else {
        this._moveTowards(this.lastSawEnemyAt as Coords);
      }
    },
    [AiState.Idle]: () => {},
  };
  /* #endregion */

  /* #region  Actions */
  moveOrTurn(tile: Tile) {
    const dirs = dirsBetween(this, tile);

    if (dirs.includes(this.facing)) {
      this.move(tile);
    } else {
      this.turn(dirs[0]);
    }
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

  attackTile(tile: Tile) {
    if (!this.canAct) return;

    if (this.equippedWeapon && weaponIsGun(this.equippedWeapon)) {
      if (this.mustReload) return;

      this._fireEquippedGun(tile);
    } else {
      this._meleeAttackTile(tile);
    }
  }

  useSelectedPower() {
    if (!this.selectedPower) return;
    if (this.selectedPower.energyCost > this.energy) return;

    if (this.selectedPower.activateIfPossible()) {
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
  /* #endregion */

  /* #region  General State */
  health = 100;
  energy = 100;

  facing: Dir = random.arrayElement([Dir.Up, Dir.Right, Dir.Down, Dir.Left]);

  inventory: Item[] = [new Pipe()];

  powers: Power[] = [];
  selectedPower: Power | null = null;

  get canAct() {
    return this.timeUntilNextAction === 0 && !this.isDead;
  }

  get isDead() {
    return this.health <= 0;
  }

  updateFacing(dir: Dir) {
    this.facing = dir;
    this.updateLastSawEnemy();
  }
  /* #endregion */

  /* #region  stores, tick, and _act */
  get game() {
    return useGame();
  }

  get animationsStore() {
    return useAnimations();
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
      this.receiveDamage(damagePerTick, DamageType.Radiation);
    } else if (this.atRadLevelOrHigher(RadLevel.High)) {
      const damagePerTurn = this.maxHealth * 0.02;
      const damagePerTick = damagePerTurn / TURN;
      this.receiveDamage(damagePerTick, DamageType.Radiation);
    }

    this.timeSpentInAiState++;
  }

  _act() {
    if (debugOptions.docileEnemies) return;

    if (debugOptions.wanderingEnemies) return this._wander();

    this._updateAiStateIfNeeded();

    this._aiStateActions[this.aiState]();
  }
  /* #endregion */
}
