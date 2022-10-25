import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { createExplosion } from '@/utils/explosions';
import { Dir } from '@/utils/map';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';
import { isCreature } from './creature';
import MapEntity, { EntityLayer } from './map-entity';

export enum Orientation {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export function isTrap(entity: MapEntity): entity is Trap {
  return entity instanceof Trap;
}

export abstract class Trap extends Actor {
  constructor(tile: Tile) {
    super(tile);
    this.setAdditionalTilesOccupied?.();

    if (this.shouldTrigger) {
      this.trigger();
    }
  }

  blocksMovement = false;
  blocksView = false;

  shouldRemoveFromGame = false;
  triggered = false;

  layer = EntityLayer.Object;

  mass = 1;

  get canAct() {
    return !this.shouldRemoveFromGame && !this.triggered;
  }

  trigger() {
    this.triggered = true;
    this.onTrigger();
    this.shouldRemoveFromGame = true;
  }

  abstract onTrigger(): void;

  _act() {
    if (this.shouldTrigger) {
      this.trigger();
    }
  }

  get shouldTrigger() {
    return this.hasCreatureOn;
  }

  get hasCreatureOn() {
    return this.tilesOccupied.some((tile) => {
      return tile.entities.some(isCreature);
    });
  }

  setAdditionalTilesOccupied?(): void;
}

export class ProximityMine extends Trap implements AsciiDrawable {
  char = '◇';
  color = 'white';

  onTrigger() {
    createExplosion(this.tile, 5, 20);
  }
}

export class TripWire extends Trap {
  constructor(tile: Tile, public orientation: Orientation) {
    super(tile);
    this.setAdditionalTilesOccupied();
  }

  static lengthFromCenter = 3;

  // anchorTiles: Partial<Record<Dir, Tile>> = {};
  anchorTiles = new Map<Tile, Dir>();

  onTrigger() {
    this.tilesOccupied.forEach((tile) => {
      createExplosion(tile, 1, 20);
    });
  }

  // This trap takes up a line
  // This function sets up all the tiles in the line
  setAdditionalTilesOccupied() {
    const { tiles, anchors } = TripWire.getTilesOccupiedIfCenteredAt(
      this.tile,
      this.orientation
    );

    tiles.forEach((tile) => {
      if (tile === this.tile) return;

      tile.addEntity(this);
    });

    this.tilesOccupied = tiles;
    this.anchorTiles = anchors;
  }

  updatePosition() {
    throw new Error('Cannot update position of trip wire');
  }

  // Start at the center tile
  // For each direction,
  //  go until we hit a non-creature entity that blocks movement, or until we reach this.lengthFromCenter
  static getTilesOccupiedIfCenteredAt(
    coords: Coords,
    orientation: Orientation
  ): {
    tiles: Tile[];
    anchors: Map<Tile, Dir>;
  } {
    const game = useGame();

    const centralTile = game.map.tileAt(coords);

    if (!this.canOccupy(centralTile)) {
      return {
        tiles: [],
        anchors: new Map<Tile, Dir>(),
      };
    }

    const tiles: Tile[] = [centralTile];
    const anchors = new Map<Tile, Dir>();

    [-1, 1].forEach((directionMult) => {
      const tilesInDir: Tile[] = [];

      for (
        let currDistFromCenter = directionMult;
        Math.abs(currDistFromCenter) <= this.lengthFromCenter;
        currDistFromCenter += directionMult
      ) {
        const currCoords = {
          x:
            coords.x +
            (orientation === Orientation.Horizontal ? currDistFromCenter : 0),
          y:
            coords.y +
            (orientation === Orientation.Vertical ? currDistFromCenter : 0),
        };

        if (!game.map.coordsInBounds(currCoords)) break;

        const tile = game.map.tileAt(currCoords);

        if (!this.canOccupy(tile)) {
          break;
        }

        tilesInDir.push(tile);
      }

      // The last tile in any given dir is an anchor
      let anchorDir: Dir;

      if (orientation === Orientation.Horizontal) {
        anchorDir = directionMult === -1 ? Dir.Left : Dir.Right;
      } else {
        anchorDir = directionMult === -1 ? Dir.Up : Dir.Down;
      }

      const anchorTile = tilesInDir[tilesInDir.length - 1] ?? centralTile;

      anchors.set(anchorTile, anchorDir);

      tiles.push(...tilesInDir);
    });

    return { tiles, anchors };
  }

  static canOccupy(tile: Tile) {
    const hasNonCreatureMovementBlocker = tile.entities.some((entity) => {
      return !isCreature(entity) && entity.blocksMovement;
    });

    return !hasNonCreatureMovementBlocker;
  }
}
