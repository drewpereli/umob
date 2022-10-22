import type { Tile } from '@/stores/map';

export enum EntityLayer {
  Terrain = 'terrain',
  Fluid = 'fluid',
  Object = 'object',
  Item = 'item',
  Creature = 'creature',
}

// Basically any item, creature, etc that can exist on the map
export default abstract class MapEntity {
  constructor(tile: Tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;

    tile.addEntity(this);
  }

  x;
  y;
  tile;

  abstract layer: EntityLayer;

  abstract blocksMovement: boolean;
  abstract blocksView: boolean;

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }

  abstract shouldRemoveFromGame: boolean;

  abstract mass: number;

  updatePosition(tile: Tile) {
    this.tile.removeEntity(this);
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;
    tile.addEntity(this);
  }
}
