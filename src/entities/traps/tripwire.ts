import { useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import { createExplosion } from '@/utils/explosions';
import { Dir } from '@/utils/map';
import { isCreature } from '../creatures/creature';
import { Trap, Orientation } from './trap';

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
