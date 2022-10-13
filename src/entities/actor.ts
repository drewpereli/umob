import {
  DamageAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import random from 'random';
import Gun from './gun';

export default class Actor {
  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  x;
  y;

  health = 100;

  moveTime = 10;
  attackTime = 2;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  inventory = [new Gun()];
  equippedWeapon = this.inventory[0];

  char = 'd';
  readonly color: string = 'white';

  // readonly map = useMap();
  readonly game = useGame();
  readonly animationsStore = useAnimations();

  animations: GameAnimation[] = [];

  move(tile: Tile) {
    if (!this.canAct) return;

    this.x = tile.x;
    this.y = tile.y;
    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  fireWeapon(actors: Actor[]) {
    console.log(actors);

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
    const x = random.int(0, 1) * 2 - 1;
    const y = random.int(0, 1) * 2 - 1;
    const coords = { x: this.x + x, y: this.y + y };
    if (this.game.actorAt(coords)) return;
    const tile = this.game.map.tileAt(coords);
    if (!tile) return;
    if (!tile.canMoveTo) return;
    this.move(tile);
  }

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }
}
