import {
  DamageAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useGame } from '@/stores/game';
import { distance, type Tile } from '@/stores/map';
import Gun from './gun';

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

  moveTime = 10;
  attackTime = 10;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  inventory = [new Gun()];
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
    this.health -= damage;
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
    if (!this.canAct) return;

    if (this.mood === Mood.Hostile) {
      if (this.canAttackPlayer) return this.fireWeapon([this.game.player]);

      const coordsPathToPlayer = this.game.map.pathBetween(
        this.coords,
        this.game.player.coords,
        this
      );

      const coordsTowardsPlayer = coordsPathToPlayer[1];

      const tile = this.game.map.tileAt(coordsTowardsPlayer);

      if (!this.canMoveTo(tile)) return;

      this.move(tile);
    }
  }

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }

  get canAttackPlayer() {
    if (!this.equippedWeapon) return false;

    const dist = distance(this, this.game.player);

    if (dist > this.equippedWeapon.range) return false;

    const tilesBetween = this.game.map
      .tilesBetween(this, this.game.player)
      .slice(1);

    const aimIsBlocked = tilesBetween.some(
      (tile) => tile.terrain.penetrationBlock > 0
    );

    return !aimIsBlocked;
  }

  canMoveTo(tile: Tile) {
    if (tile.terrain.blocksMovement) return false;
    if (this.game.actorAt(tile)) return false;
    return true;
  }
}
