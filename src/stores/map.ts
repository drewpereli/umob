import bresenham from '@/utils/bresnham';
import { generate } from '@/utils/map-generation';
import { defineStore } from 'pinia';

export enum Dir {
  Up,
  Right,
  Down,
  Left,
}

export const useMap = defineStore('map', {
  state: () => ({
    tiles: [] as Tile[][],
    width: 80,
    height: 80,
  }),
  getters: {
    tileAt() {
      return (coords: Coords) => {
        return this.tiles[coords.y][coords.x];
      };
    },
    tilesBetween() {
      return (t1: Tile, t2: Tile) => {
        const coords = bresenham(t1, t2);

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

  get canMoveTo() {
    return this.terrain.moveTimeMultiplier !== null;
  }

  get isTransparent() {
    return this.terrain instanceof Floor;
  }

  get id() {
    return `${this.x},${this.y}`;
  }
}

abstract class Terrain {
  abstract readonly char: string;
  abstract readonly moveTimeMultiplier: number | null;
  readonly color: string = '#ccc';
}

export class Floor extends Terrain {
  char = '•';
  moveTimeMultiplier = 1;
  color = 'gray';
}

export class Wall extends Terrain {
  char = '#';
  moveTimeMultiplier = null;
}
