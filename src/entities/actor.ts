import {
  BulletAnimation,
  DamageAnimation,
  useAnimations,
  type GameAnimation,
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
} from '@/utils/map';
import { Grenade, type Power } from '@/utils/powers';
import { random } from '@/utils/random';
import type { Damageable } from './damageable';
import { Pistol, ShotGun } from './gun';

enum Mood {
  Hostile = 'hostile',
}

export type Covers = Record<Dir, Cover>;

const dirChars: Record<Dir, string> = {
  [Dir.Up]: '↑',
  [Dir.Right]: '→',
  [Dir.Down]: '↓',
  [Dir.Left]: '←',
};

export default class Actor implements Damageable {
  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  name = 'actor';

  x;
  y;

  health = 100;
  maxHealth = 100;

  moveTime = 2;
  turnTime = 1;
  attackTime = 2;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  viewRange = 10;

  accuracyMultiplier = 1;
  evasionMultiplier = 1;

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

  readonly game = useGame();
  readonly animationsStore = useAnimations();

  mood = Mood.Hostile;

  move(tile: Tile) {
    if (!this.canAct) return;

    this.x = tile.x;
    this.y = tile.y;
    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  turn(dir: Dir) {
    if (!this.canAct || dir === this.facing) return;

    this.facing = dir;
    this.timeUntilNextAction = this.turnTime;
  }

  fireWeapon(entities: (Damageable & Coords)[]) {
    if (!this.canAct) return;

    entities.forEach((entity, idx) => {
      const hitChance = this.hitChanceForDamageable(entity);

      const willHit = random.float(0, 1) < hitChance;

      if (willHit) {
        if (this.equippedWeapon.knockBack && entity instanceof Actor) {
          const dirs = dirsBetween(this, entity);
          const dir = random.arrayElement(dirs);
          entity.receiveKnockBack(
            this.equippedWeapon.damage,
            this.equippedWeapon.knockBack,
            dir
          );
        }

        entity.receiveDamage(this.equippedWeapon.damage);
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

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
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

  act() {
    if (debugOptions.docileEnemies) return;

    if (!this.canAct) return;

    if (this.mood === Mood.Hostile) {
      if (this.canAttackPlayer) return this.fireWeapon([this.game.player]);

      if (this.canSeePlayer) {
        const coordsPathToPlayer = this.game.map.pathBetween(
          this.coords,
          this.game.player.coords,
          this
        );

        const coordsTowardsPlayer = coordsPathToPlayer[0];

        if (!coordsTowardsPlayer) return;

        const tile = this.game.map.tileAt(coordsTowardsPlayer);

        if (!this.canMoveTo(tile)) return;

        this.moveOrTurn(tile);
      } else {
        this.wander();
      }
    }
  }

  moveOrTurn(tile: Tile) {
    const dirs = dirsBetween(this, tile);

    if (dirs.includes(this.facing)) {
      this.move(tile);
    } else {
      this.turn(dirs[0]);
    }
  }

  wander() {
    const adjacentCoords = [
      { x: this.x - 1, y: this.y },
      { x: this.x + 1, y: this.y },
      { x: this.x, y: this.y - 1 },
      { x: this.x, y: this.y + 1 },
    ];

    const tiles = adjacentCoords
      .map((coords) => this.game.map.tileAt(coords))
      .filter((tile) => {
        if (!tile) return false;
        if (tile.terrain.blocksMovement) return false;
        if (this.game.actorAt(tile)) return false;
        return true;
      });

    if (tiles.length === 0) return;

    this.moveOrTurn(random.arrayElement(tiles));
  }

  get coords(): Coords {
    return { x: this.x, y: this.y };
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

    return true;
  }

  canMoveTo(tile: Tile) {
    if (tile.terrain.blocksMovement) return false;
    if (this.game.actorAt(tile)) return false;
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

    const actor: Actor = damageable as Actor;

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
    let additionalActorDamaged: Actor | null = null;
    let hitWall = false;

    for (let i = 0; i < amount; i++) {
      const next = this.game.map.adjacentTile(toCoords, dir);

      if (!next) {
        break;
      }

      const actor = this.game.actorAt(next);

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

    this.x = toCoords.x;
    this.y = toCoords.y;
  }
}
