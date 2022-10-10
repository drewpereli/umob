import { defineStore } from 'pinia';

export const useMap = defineStore('map', {
  state: () => ({
    tiles: [] as Tile[],
    width: 20,
    height: 20,
  }),
  getters: {
    tileAt() {
      return (coords: Coords) => {
        return this.tiles.find(
          (tile) => tile.x === coords.x && tile.y === coords.y
        );
      };
    },
  },
  actions: {
    generate() {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const atEdge =
            x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;

          const terrain = atEdge ? new Wall() : new Floor();

          const tile = new Tile({ x, y, terrain });

          this.tiles.push(tile);
        }
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
