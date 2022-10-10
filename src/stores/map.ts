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
      for (let y = 0; y < this.height; y++) {
        const row: Tile[] = [];

        for (let x = 0; x < this.width; x++) {
          const atEdge =
            x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;

          const terrain = atEdge ? new Wall() : new Floor();

          const tile = new Tile({ x, y, terrain });

          row.push(tile);
        }

        this.tiles.push(row);
      }
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
}

class Floor extends Terrain {
  char = '•';
  moveTimeMultiplier = 1;
}

class Wall extends Terrain {
  char = '#';
  moveTimeMultiplier = null;
}
