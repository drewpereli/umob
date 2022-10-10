import { generate } from '@/utils/map-generation';
import { defineStore } from 'pinia';

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
