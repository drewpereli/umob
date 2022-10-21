import { Cover } from '@/utils/map';
import { isDamageable, type Damageable } from './damageable';
import type MapEntity from './map-entity';

export abstract class Terrain {
  abstract readonly type: string;
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

  affectEntityOn?(entity: MapEntity): void;
}

export class Floor extends Terrain {
  type = 'floor';
  char = '•';
  moveTimeMultiplier = 1;
  color = 'rgba(255,255,255,0.2)';
}

export class Wall extends Terrain implements Damageable {
  type = 'wall';
  char = '#';
  moveTimeMultiplier = null;
  penetrationBlock = 2;
  blocksView = true;
  terrainOnDie = new HalfWall();
  cover = Cover.Full;

  readonly IMPLEMENTS_DAMAGEABLE = true;

  receiveDamage(damage: number) {
    this.health -= damage;
  }

  isCurrentlyDamageable = true;
}

export class HalfWall extends Terrain {
  type = 'half-wall';
  char = '▄';
  moveTimeMultiplier = 2;
  color = '#aaa';
  cover = Cover.Half;
}

export class Lava extends Terrain {
  type = 'lava';
  char = '~';
  moveTimeMultiplier = 2;

  affectEntityOn(entity: MapEntity) {
    if (isDamageable(entity)) {
      entity.receiveDamage(20);
    }
  }
}
