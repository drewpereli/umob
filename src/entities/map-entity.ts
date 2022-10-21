import { coordsEqual } from '@/utils/map';

// Basically any item, creature, etc that can exist on the map
export default abstract class MapEntity {
  constructor({ x, y }: Coords) {
    this.x = x;
    this.y = y;
  }

  x;
  y;

  abstract blocksMovement: boolean;

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }

  get occupies(): Coords[] {
    return [this.coords];
  }

  abstract shouldRemoveFromGame: boolean;

  occupiesCoords(coords: Coords) {
    return this.occupies.some((entityCoords) =>
      coordsEqual(entityCoords, coords)
    );
  }
}
