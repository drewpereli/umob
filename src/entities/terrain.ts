import { useGame } from '@/stores/game';
import { Cover } from '@/utils/map';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';
import { isDamageable, type Damageable } from './damageable';
import MapEntity, { EntityLayer } from './map-entity';

export type Terrain = MapEntity & {
  readonly type: string;
  readonly moveTimeMultiplier: number | null;
  readonly blocksView: boolean;
  readonly terrainOnDie?: Terrain;
  readonly cover: Cover;
  readonly char?: string;
  readonly color?: string;
  readonly layer: EntityLayer.Terrain;
};

export class Wall
  extends MapEntity
  implements Terrain, Damageable, AsciiDrawable
{
  type = 'wall';
  char = '#';
  color = 'white';
  shouldRemoveFromGame = false;
  blocksMovement = true;
  moveTimeMultiplier = null;
  penetrationBlock = 2;
  blocksView = true;
  mass = 2000;
  cover = Cover.Full;

  readonly layer = EntityLayer.Terrain;

  readonly IMPLEMENTS_DAMAGEABLE = true;

  health = 100;

  receiveDamage(damage: number) {
    this.health -= damage;

    if (this.health <= 0) {
      const halfWall = new HalfWall(this.tile);
      useGame().addMapEntity(halfWall);
      console.log('in here');
      this.shouldRemoveFromGame = true;
    }
  }

  isCurrentlyDamageable = true;
}

export class HalfWall extends MapEntity implements Terrain, AsciiDrawable {
  type = 'half-wall';
  char = '▄';
  blocksView = false;
  blocksMovement = false;
  moveTimeMultiplier = 2;
  color = '#aaa';
  cover = Cover.Half;
  mass = 1000;
  shouldRemoveFromGame = false;
  readonly layer = EntityLayer.Terrain;
}

export class Lava extends Actor implements Terrain {
  type = 'lava';
  char = '~';
  moveTimeMultiplier = 4;
  mass = 0;
  shouldRemoveFromGame = false;
  cover = Cover.None;
  canAct = true;
  blocksMovement = false;
  blocksView = false;
  readonly layer: EntityLayer.Terrain = EntityLayer.Terrain;

  _act() {
    this.tile.entities.forEach((entity) => {
      if (entity === this) return;

      if (isDamageable(entity)) {
        entity.receiveDamage(20);
      }
    });
  }
}

export function isTerrain(entity: MapEntity): entity is Terrain {
  return entity.layer === EntityLayer.Terrain;
}
