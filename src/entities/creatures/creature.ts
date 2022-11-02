import {
  DamageAnimation,
  KnockBackAnimation,
  useAnimations,
} from '@/stores/animations';
import { TURN, useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import {
  addPolarToCartesian,
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
import { damageRoll, type Damageable } from '../damageable';
import Gun, {
  damageablesAimedAt,
  tilesAimedAt,
  weaponIsGun,
} from '../weapons/gun';
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
import { Lava } from '../fluid';
import { angle } from '@/utils/math';
import bresenham from '@/utils/bresenham';
import { last } from '@/utils/array';
import { createAttackMessage } from '@/stores/messages';
import { Burning } from '@/status-effects/burning';
import { defaultBurn, defaultStopBurning, type Flammable } from '../flammable';
import { OcclusionVisualizer } from '@/status-effects/occlusion-visualizer';
import { WearableSlot, type Wearable } from '@/wearables/wearable';

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

export enum AiState {
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
  implements Damageable, AsciiDrawable, Flammable
{
  constructor(tile: Tile, public alignment = CreatureAlignment.AgainstPlayer) {
    super(tile);
    this.updateLastSawEnemy();
  }

  /* #region  Damageable */
  receiveDamage(damage: number, type: DamageType) {
    damage *= this.resistanceMultiplierForDamageType(type);

    if (type === DamageType.Physical) {
      damage -= this.armor;
    }

    if (damage <= 0) return;

    this.health = Math.max(this.health - damage, 0);

    if (this.game.coordsVisible(this)) {
      const animation = new DamageAnimation(this);
      this.animationsStore.addAnimation(animation);
    }
  }

  receiveKnockBack(damage: number, amount: number, from: Coords) {
    const target = addPolarToCartesian(this, {
      r: amount,
      t: angle(from, this),
    });

    const coordsToMoveThrough = bresenham(this, target).slice(1);

    let additionalActorDamaged: Creature | null = null;
    let hitWall = false;

    const tilesMovedThrough: Tile[] = [];

    for (const coords of coordsToMoveThrough) {
      const tile = this.game.map.tileAt(coords);

      if (this.game.creatureCanOccupy(tile)) {
        tilesMovedThrough.push(tile);
        continue;
      }

      const actor = this.game.creatureAt(tile);

      if (actor) {
        additionalActorDamaged = actor;
      } else {
        hitWall = true;
      }

      break;
    }

    const toTile = last(tilesMovedThrough);

    if (additionalActorDamaged) {
      additionalActorDamaged.receiveDamage(damage * 0.25, DamageType.Physical);
    }

    if (hitWall) {
      this.receiveDamage(damage * 0.25, DamageType.Physical);
    }

    if (toTile) {
      this.game.animations.addAnimation(
        new KnockBackAnimation(
          this,
          this.coords,
          toTile,
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

      this.updatePosition(toTile);
    }
  }

  get isCurrentlyDamageable() {
    return this.health > 0;
  }

  penetrationBlock = 1;

  readonly IMPLEMENTS_DAMAGEABLE = true;
  /* #endregion */

  /* #region UI and AsciiDrawable */
  abstract readonly name: string;

  abstract readonly defaultChar: string;

  get char() {
    return this.game.directionViewMode
      ? dirChars[this.facing]
      : this.defaultChar;
  }

  abstract readonly color: string;

  get messageDescriptor() {
    return `the ${this.name}`;
  }
  /* #endregion */

  /* #region  MapEntity */
  layer = EntityLayer.Creature;
  blocksMovement = true;
  blocksView = false;
  conductsElectricity = true;

  get shouldRemoveFromGame() {
    return this.isDead;
  }

  set shouldRemoveFromGame(_: boolean) {}

  updatePosition(tile: Tile) {
    super.updatePosition(tile);
    this.updateLastSawEnemy();
  }
  /* #endregion */

  /* #region  Base Attributes */
  maxHealth = 100;

  baseMoveTime = TURN;
  attackTime = TURN;
  reloadTime = TURN;

  baseViewRange = 10;
  baseViewAngle: number = 90;

  baseAccuracy = 8;
  baseEvasion = 8;

  baseArmor = 0;

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

    const equipmentEffect = this.equippedWearablesArray.reduce(
      (total, wearable) => total + wearable.moveTimeEffect,
      0
    );

    moveTime += equipmentEffect;

    return Math.max(1, moveTime);
  }

  get turnTime() {
    return this.moveTime;
  }

  get powerCoolDownPerTick() {
    if (this.atRadLevelOrHigher(RadLevel.Extreme)) {
      return 0;
    }

    return 1;
  }

  get viewRange() {
    let range = this.baseViewRange;

    if (this.atRadLevelOrHigher(RadLevel.Low)) {
      range -= 2;
    }

    return Math.max(range, 0);
  }

  get viewAngle() {
    if (this.hasStatusEffect(OcclusionVisualizer)) {
      return 360;
    }

    return this.baseViewAngle;
  }

  get accuracy() {
    if (this.hasStatusEffect(TargetingArray)) {
      return Infinity;
    }

    let acc = this.baseAccuracy + this.weaponData.accuracyBonus;

    if (this.atRadLevelOrHigher(RadLevel.Medium)) {
      acc -= 2;
    }

    return Math.max(acc, 1);
  }

  get evasion() {
    return this.baseEvasion;
  }

  get armor() {
    const equipmentEffect = this.equippedWearablesArray.reduce(
      (total, wearable) => total + wearable.armorEffect,
      0
    );

    const val = this.baseArmor + equipmentEffect;

    return Math.max(val, 0);
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
    accuracyBonus: 5,
    attackTimeMultiplier: 1,
    knockBack: 0,
    flankingBonus: 0,
    damageType: DamageType.Physical,
    attackActionMessageDescription: 'swung at',
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
      (effect) =>
        effect.name === statusEffect.name &&
        effect.source === statusEffect.source
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
    const coordsPath = this.game.map.pathBetween(
      this.coords,
      coords,
      this._pathfindingValueForTile
    );

    const coordsTowardsTarget = coordsPath[0];

    let tileToMoveTo: Tile | null = null;

    if (coordsTowardsTarget) {
      const tile = this.game.map.tileAt(coordsTowardsTarget);

      if (this.game.creatureCanOccupy(tile)) {
        tileToMoveTo = tile;
      }
    }

    if (tileToMoveTo) {
      this.moveOrTurn(tileToMoveTo);
    } else {
      // If we can turn towards the tile, do that
      const dirTowards = dirsBetween(this.coords, coords);

      if (dirTowards.includes(this.facing)) {
        return;
      }

      this.turn(random.arrayElement(dirTowards));
    }
  }

  _wander() {
    const tiles = this.tile.adjacentTiles.filter((tile) => {
      return this.game.creatureCanOccupy(tile);
    });

    if (tiles.length === 0) return;

    this.moveOrTurn(random.arrayElement(tiles));
  }

  // Assumes the tile is in range
  _fireEquippedGun(tile: Tile) {
    const gun = this.equippedWeapon as Gun;

    const damageables = damageablesAimedAt(this.tile, tile, gun);

    const hit = this._attemptAttackAttackableDamageables(damageables);

    gun.addAnimationOnShoot(this, tile, hit);

    if (gun.onAttack) {
      gun.onAttack(this, tile);
    }

    gun.amoLoaded--;

    if (damageables.length) {
      const message = createAttackMessage(
        this,
        damageables,
        hit,
        this.weaponData
      );

      this.messagesStore.addMessage(message);
    }
  }

  // Assumes the tile is in range
  _meleeAttackTile(tile: Tile) {
    const hit = this._attemptAttackAttackableDamageables(tile.damageables);

    if (this.weaponData.onAttack) {
      this.weaponData.onAttack(this, tile);
    }

    if (tile.damageables.length) {
      const message = createAttackMessage(
        this,
        tile.damageables,
        hit,
        this.weaponData
      );

      this.messagesStore.addMessage(message);
    }
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
      let evasion;
      if (isCreature(entity)) {
        evasion = entity.evasion * entity.coverMultiplierWhenShotFrom(this);
      } else {
        evasion = entity.evasion;
      }

      const willHit = damageRoll(this.accuracy, evasion);

      let damage = weaponData.damage;

      if (willHit) {
        if (weaponData.knockBack && entity instanceof Creature) {
          entity.receiveKnockBack(
            weaponData.damage,
            weaponData.knockBack,
            this
          );
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

    if (weaponData.onDamage) {
      hit.forEach((entity) => weaponData.onDamage?.(entity));
    }

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

  // Used for pathfinding.
  // Runs on each tile to generate the matrix for pathfinding
  // Should return 0 if the entity will not move to that tile
  // 1 or greater if the entity will/can.
  // Pathfinding will already prevent walking to tiles with movement blocking entities, so we don't have to worry about that here
  // This is more for AI, i.e. walking into lava, fire, etc
  get _pathfindingValueForTile() {
    return (tile: Tile) => {
      if (tile.fluid instanceof Lava) return 0;
      if (tile.flammables.some((f) => f.isBurning)) return 0;
      return 1;
    };
  }
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

  strafe(tile: Tile) {
    if (!this.canAct) return;

    this.updatePosition(tile);

    this.timeUntilNextAction =
      this.moveTime * (tile.moveTimeMultiplier as number) * 2;
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

    if (this.selectedPower.activateIfPossible()) {
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

  putOn(wearable: Wearable) {
    this.equippedWearables[wearable.wearableSlot] = wearable;
  }

  takeOff(wearable: Wearable) {
    this.equippedWearables[wearable.wearableSlot] = null;
  }
  /* #endregion */

  /* #region  General State */
  _health = this.maxHealth;

  get health() {
    return this._health;
  }

  set health(val: number) {
    if (val > this.maxHealth) {
      val = this.maxHealth;
    } else if (val < 0) {
      val = 0;
    }

    this._health = val;

    if (val <= 0) {
      this.markForRemoval();
    }
  }

  changeHealth(amount: number) {
    this.health = this.health + amount;
  }

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

  equippedWearables: Record<WearableSlot, Wearable | null> = {
    [WearableSlot.Head]: null,
    [WearableSlot.Body]: null,
  };

  get equippedWearablesArray() {
    return Object.values(this.equippedWearables).filter(
      (w): w is Wearable => w !== null
    );
  }
  /* #endregion */

  /* #region  flammable */
  get isBurning() {
    return this.statusEffects.some((effect) => effect.name === 'burning');
  }

  set isBurning(val: boolean) {
    //
  }

  startBurning() {
    this.addStatusEffect(new Burning(this, 10 * TURN));
  }

  burn() {
    defaultBurn(this);
    this.receiveDamage(1, DamageType.Heat);
  }

  stopBurning() {
    defaultStopBurning(this);
    const burning = this.statusEffects.find((s) => s instanceof Burning);

    if (!burning) return;

    this.removeStatusEffect(burning);
  }

  burnCollocatedChance = 0.5;
  burnAdjacentChance = 0.1;
  burningDuration = 0;
  readonly IMPLEMENTS_FLAMMABLE = true;
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

    this.powers.forEach((power) =>
      power.countdownCoolDown(this.powerCoolDownPerTick)
    );

    this.rads = Math.max(0, this.rads - this.radsLostPerTick);

    this.statusEffects.forEach((effect) => {
      effect.tick();
    });

    if (this.atRadLevelOrHigher(RadLevel.Extreme)) {
      const damagePerTurn = this.maxHealth * 0.02;
      const damagePerTick = damagePerTurn / TURN;
      this.changeHealth(-damagePerTick);
    } else if (this.atRadLevelOrHigher(RadLevel.High)) {
      const damagePerTurn = this.maxHealth * 0.02;
      const damagePerTick = damagePerTurn / TURN;
      this.changeHealth(-damagePerTick);
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
