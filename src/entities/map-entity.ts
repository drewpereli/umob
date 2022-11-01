import { useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import { useMessages } from '@/stores/messages';

export enum EntityLayer {
  Terrain = 'terrain',
  Fluid = 'fluid',
  Object = 'object',
  Item = 'item',
  Creature = 'creature',
  Gas = 'gas',
}

// Basically any item, creature, etc that can exist on the map
export default abstract class MapEntity {
  constructor(tile: Tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;

    this.tilesOccupied = [tile];
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

  get messagesStore() {
    return useMessages();
  }

  abstract shouldRemoveFromGame: boolean;

  abstract mass: number;

  tilesOccupied: Tile[] = [];

  updatePosition(tile: Tile) {
    this.tile.removeEntity(this);
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;
    tile.addEntity(this);
    this.tilesOccupied = [tile];
  }

  markForRemoval() {
    this.shouldRemoveFromGame = true;
    useGame().markEntityForRemoval(this);
  }
}
