import type { Tile } from '@/stores/map';
import { coordsEqual } from '@/utils/map';

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

  get occupies(): Coords[] {
    return [this.coords];
  }

  abstract shouldRemoveFromGame: boolean;

  abstract mass: number;

  occupiesCoords(coords: Coords) {
    return this.occupies.some((entityCoords) =>
      coordsEqual(entityCoords, coords)
    );
  }

  updatePosition(tile: Tile) {
    this.tile.removeEntity(this);
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;
    tile.addEntity(this);
  }
}
