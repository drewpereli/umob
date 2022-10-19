import {
  BulletAnimation,
  DamageAnimation,
  KnockBackAnimation,
  useAnimations,
} from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { debugOptions } from '@/utils/debug-options';
import {
  coordsInViewCone,
  Cover,
  coverMultiplierBetween,
  Dir,
  DIRS,
  dirsBetween,
  distance,
  FlankingDir,
  flankingDirBetween,
} from '@/utils/map';
import { Grenade, type Power } from '@/utils/powers';
import { random } from '@/utils/random';
import { Actor } from './actor';
import type { Damageable } from './damageable';
import { Pistol, ShotGun } from './gun';
import MapEntity from './map-entity';

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

export default abstract class Creature extends Actor implements Damageable {
  name = 'actor';

  readonly IMPLEMENTS_DAMAGEABLE = true;

  health = 100;
  maxHealth = 100;

  moveTime = 2;
  turnTime = 1;
  attackTime = 2;

  penetrationBlock = 1;

  viewRange = 10;

  accuracyMultiplier = 1;
  evasionMultiplier = 1;

  blocksMovement = true;

  facing: Dir = random.arrayElement([Dir.Up, Dir.Right, Dir.Down, Dir.Left]);
  viewAngle: number = 90;

  inventory = [new Pistol()];
  equippedWeapon = this.inventory[0];

  powers = [new Grenade()];
  selectedPower: Power | null = null;

  defaultChar = 'd';

  get char() {
    return this.game.directionViewMode
      ? dirChars[this.facing]
      : this.defaultChar;
  }

  readonly color: string = 'white';

  get game() {
    return useGame();
  }

  get animationsStore() {
    return useAnimations();
  }

  move(tile: Tile) {
    if (!this.canAct) return;

    this.updatePosition(tile);

    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  updatePosition(coords: Coords) {
    this.x = coords.x;
    this.y = coords.y;
  }

  updateFacing(dir: Dir) {
    this.facing = dir;
  }

  turn(dir: Dir) {
    if (!this.canAct || dir === this.facing) return;

    this.updateFacing(dir);

    this.timeUntilNextAction = this.turnTime;
  }

  fireWeapon(entities: (Damageable & Coords)[]) {
    if (!this.canAct) return;

    entities.forEach((entity, idx) => {
      const hitChance = this.hitChanceForDamageable(entity);

      const willHit = random.float(0, 1) < hitChance;

      let damage = this.equippedWeapon.damage;

      if (willHit) {
        if (this.equippedWeapon.knockBack && entity instanceof Creature) {
          const dirs = dirsBetween(this, entity);
          const dir = random.arrayElement(dirs);
          entity.receiveKnockBack(
            this.equippedWeapon.damage,
            this.equippedWeapon.knockBack,
            dir
          );
        }

        if (entity instanceof Creature && this.equippedWeapon.flankingBonus) {
          const flankingDir = flankingDirBetween(this, entity, entity.facing);
          const bonusMultiplier = flankingDirBonusMultipliers[flankingDir];

          damage +=
            damage * this.equippedWeapon.flankingBonus * bonusMultiplier;
        }

        entity.receiveDamage(damage);
      }

      if (idx === 0) {
        this.game.animations.addAnimation(
          new BulletAnimation(this, entity, willHit)
        );
      }
    });

    if (entities.length === 0) {
      this.game.animations.addAnimation(
        new BulletAnimation(this, this.game.selectedTile as Coords, false)
      );
    }

    this.timeUntilNextAction =
      this.attackTime * this.equippedWeapon.attackTimeMultiplier;
  }

  useSelectedPower() {
    if (!this.selectedPower) return;

    this.selectedPower.activate();
    this.timeUntilNextAction = this.selectedPower.useTime;
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
    if (!this.equippedWeapon) return false;

    const dist = distance(this, this.game.player);

    if (dist > this.equippedWeapon.range) return false;

    const tilesBetween = this.game.map
      .tilesBetween(this, this.game.player)
      .slice(1, -1);

    const aimIsBlocked = tilesBetween.some(
      (tile) => tile.terrain.penetrationBlock > 0
    );

    return !aimIsBlocked;
  }

  get canSeePlayer() {
    if (distance(this, this.game.player) > this.viewRange) return false;

    if (!coordsInViewCone(this, this.game.player, this.viewAngle, this.facing))
      return false;

    // See if view is blocked by a wall
    const tilesBetween = this.game.map.tilesBetween(this, this.game.player);

    if (tilesBetween.some((tile) => tile.blocksView)) return false;

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
      this.equippedWeapon.accuracy *
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

      if (next.terrain.blocksMovement) {
        hitWall = true;
        break;
      }

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

    this.updatePosition(toCoords);
  }

  get shouldRemoveFromGame() {
    return this.isDead;
  }
}
