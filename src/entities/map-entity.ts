import type { Tile } from '@/stores/map';

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

  abstract blocksMovement: boolean;

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
