import bresenham from '@/utils/bresnham';
import { generate } from '@/utils/map-generation';
import { defineStore } from 'pinia';
import pathfinding from 'pathfinding';
import type Actor from '@/entities/actor';
import { debugOptions } from '@/utils/debug-options';
import { random } from '@/utils/random';

export enum Dir {
  Up,
  Right,
  Down,
  Left,
}

export const useMap = defineStore('map', {
  state: () => ({
    tiles: [] as Tile[][],
    width: debugOptions.smallMap ? 31 : 80,
    height: debugOptions.smallMap ? 31 : 80,
  }),
  getters: {
    tileAt() {
      return (coords: Coords) => {
        return this.tiles[coords.y][coords.x];
      };
    },
    tilesBetween() {
      return (c1: Coords, c2: Coords) => {
        const coords = bresenham(c1, c2);

        return coords.map(this.tileAt);
      };
    },
    adjacentTile() {
      return (tile: Tile, dir: Dir): Tile | undefined => {
        const xDiff = dir === Dir.Left ? -1 : dir === Dir.Right ? 1 : 0;
        const yDiff = dir === Dir.Up ? -1 : dir === Dir.Down ? 1 : 0;

        const x = tile.x + xDiff;
        const y = tile.y + yDiff;

        return this.tileAt({ x, y });
      };
    },
    pathBetween() {
      return (from: Coords, to: Coords, actor: Actor): Coords[] => {
        const matrix = this.tiles.map((row) => {
          return row.map((tile) => {
            if (tile.terrain.blocksMovement) return 1;
            if (coordsEqual(tile, from)) return 0;
            if (coordsEqual(tile, to)) return 0;
            if (actor.game.actorAt(tile)) return 1;
            return 0;
          });
        });

        const grid = new pathfinding.Grid(matrix);

        const finder = new pathfinding.AStarFinder();

        const path = finder.findPath(from.x, from.y, to.x, to.y, grid);

        return path.map(([x, y]) => ({ x, y }));
      };
    },
    randomFloorTile() {
      return () => {
        const floorTiles: Tile[] = this.tiles
          .flat()
          .filter((tile) => tile.terrain instanceof Floor);

        return random.arrayElement(floorTiles);
      };
    },
    tilesInRadius() {
      return (center: Coords, radius: number) => {
        const rowStart = Math.max(center.y - radius, 0);
        const rowEnd = center.y + radius + 1;
        const colStart = Math.max(center.x - radius, 0);
        const colEnd = center.x + radius + 1;

        const square = this.tiles
          .slice(rowStart, rowEnd)
          .map((row) => {
            return row.slice(colStart, colEnd);
          })
          .flat();

        return square.filter((tile) => distance(center, tile) <= radius);
      };
    },
    randomAdjacent() {
      return (coords: Coords): Coords => {
        const xOrY = random.bool() ? 'x' : 'y';
        const plusOrMinus = random.bool() ? -1 : 1;

        return {
          ...coords,
          [xOrY]: coords[xOrY] + plusOrMinus,
        };
      };
    },
  },
  actions: {
    generate() {
      this.tiles = generate(this.width, this.height);
    },
  },
});

export class Tile {
  constructor({ x, y, terrain }: Coords & { terrain?: Terrain }) {
    this.x = x;
    this.y = y;
    this.terrain = terrain ?? new Floor();
  }

  readonly x;
  readonly y;
  terrain;

  terrainLastSeenByPlayer?: Pick<Terrain, 'char' | 'color'>;

  get isTransparent() {
    return this.terrain instanceof Floor;
  }

  get id() {
    return `${this.x},${this.y}`;
  }

  onPlayerSees() {
    const { char, color } = this.terrain;
    this.terrainLastSeenByPlayer = { char, color };
  }
}

abstract class Terrain {
  abstract readonly char: string;
  abstract readonly moveTimeMultiplier: number | null;
  readonly color: string = '#ccc';
  readonly penetrationBlock: number = 0;

  get blocksMovement() {
    return this.moveTimeMultiplier === null;
  }
}

export class Floor extends Terrain {
  char = '•';
  moveTimeMultiplier = 1;
  color = 'rgba(255,255,255,0.2)';
}

export class Wall extends Terrain {
  char = '#';
  moveTimeMultiplier = null;
  penetrationBlock = 2;
}

export function coordsEqual(c1: Coords, c2: Coords) {
  return c1.x === c2.x && c1.y === c2.y;
}

export function distance(c1: Coords, c2: Coords) {
  return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2);
}

export function angle(c1: Coords, c2: Coords) {
  return Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI);
}

export function angularDistance(sourceA: number, targetA: number) {
  return Math.abs(((((targetA - sourceA + 180) % 360) + 360) % 360) - 180);
}
