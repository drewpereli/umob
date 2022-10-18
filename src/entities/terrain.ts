import { Cover } from '@/utils/map';
import type { Damageable } from './damageable';

export abstract class Terrain {
  abstract readonly char: string;
  abstract readonly moveTimeMultiplier: number | null;
  readonly color: string = '#ccc';
  readonly blocksView: boolean = false;
  readonly terrainOnDie?: Terrain;
  readonly penetrationBlock: number = 0;
  readonly cover: Cover = Cover.None;
  health = 100;

  get blocksMovement() {
    return this.moveTimeMultiplier === null;
  }
}

export class Floor extends Terrain {
  char = '•';
  moveTimeMultiplier = 1;
  color = 'rgba(255,255,255,0.2)';
}

export class Wall extends Terrain implements Damageable {
  char = '#';
  moveTimeMultiplier = null;
  penetrationBlock = 2;
  blocksView = true;
  terrainOnDie = new HalfWall();
  cover = Cover.Full;

  receiveDamage(damage: number) {
    this.health -= damage;
  }

  isCurrentlyDamageable = true;
}

export class HalfWall extends Terrain {
  char = '▄';
  moveTimeMultiplier = 2;
  color = '#aaa';
  cover = Cover.Half;
}

export class Lava extends Terrain {
  char = '~';
  moveTimeMultiplier = 2;
}
