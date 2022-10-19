// Basically any item, creature, etc that can exist on the map
export default abstract class MapEntity {
  constructor({ x, y }: Coords) {
    this.x = x;
    this.y = y;
  }

  x;
  y;
  penetrationBlock = 0; // If and how much this block weapon fire

  abstract blocksMovement: boolean;
  abstract char: string; // The character to display for this entity
  abstract color: string;

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }

  abstract shouldRemoveFromGame: boolean;
}
