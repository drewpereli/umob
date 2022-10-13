import {
  DamageAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useGame } from '@/stores/game';
import { distance, type Tile } from '@/stores/map';
import { debugOptions } from '@/utils/debug-options';
import { Pistol, ShotGun } from './gun';

enum Mood {
  Hostile = 'hostile',
}

export default class Actor {
  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  x;
  y;

  health = 100;
  maxHealth = 100;

  moveTime = 2;
  attackTime = 2;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  viewRange = 10;

  inventory = [new Pistol()];
  equippedWeapon = this.inventory[0];

  char = 'd';
  readonly color: string = 'white';

  readonly game = useGame();
  readonly animationsStore = useAnimations();

  animations: GameAnimation[] = [];

  mood = Mood.Hostile;

  move(tile: Tile) {
    if (!this.canAct) return;

    this.x = tile.x;
    this.y = tile.y;
    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  fireWeapon(actors: Actor[]) {
    if (!this.canAct) return;

    actors.forEach((actor) => actor.receiveFire(this.equippedWeapon.damage));

    this.timeUntilNextAction =
      this.attackTime * this.equippedWeapon.attackTimeMultiplier;
  }

  receiveFire(damage: number) {
    this.health = Math.max(this.health - damage, 0);
    const animation = new DamageAnimation(this);
    this.animationsStore.addAnimation(animation);
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

        const coordsTowardsPlayer = coordsPathToPlayer[1];

        if (!coordsTowardsPlayer) return;

        const tile = this.game.map.tileAt(coordsTowardsPlayer);

        if (!this.canMoveTo(tile)) return;

        this.move(tile);
      }
    }
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

    return true;
  }

  canMoveTo(tile: Tile) {
    if (tile.terrain.blocksMovement) return false;
    if (this.game.actorAt(tile)) return false;
    return true;
  }
}
