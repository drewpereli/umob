import bresenham from '@/utils/bresnham';
import { generate } from '@/utils/map-generation';
import { defineStore } from 'pinia';
import type Creature from '@/entities/creature';
import { debugOptions } from '@/utils/debug-options';
import { random } from '@/utils/random';
import { astar, Graph } from '@/utils/astar';
import type { Damageable } from '@/entities/damageable';
import { distance, coordsEqual, Dir, Cover } from '@/utils/map';
import { Floor, Terrain, Wall } from '@/entities/terrain';
import type MapEntity from '@/entities/map-entity';

export const useMap = defineStore('map', {
  state: () => ({
    tiles: [] as Tile[][],
    width: debugOptions.smallMap ? 31 : 80,
    height: debugOptions.smallMap ? 31 : 80,
  }),
  getters: {
    tileAt() {
      return (coords: Coords) => {
        return this.tiles[coords.y]?.[coords.x];
      };
    },
    tilesBetween() {
      return (c1: Coords, c2: Coords) => {
        const coords = bresenham(c1, c2);

        return coords.map(this.tileAt);
      };
    },
    adjacentTile() {
      return (coords: Coords, dir: Dir): Tile | undefined => {
        const xDiff = dir === Dir.Left ? -1 : dir === Dir.Right ? 1 : 0;
        const yDiff = dir === Dir.Up ? -1 : dir === Dir.Down ? 1 : 0;

        const x = coords.x + xDiff;
        const y = coords.y + yDiff;

        return this.tileAt({ x, y });
      };
    },
    pathBetween() {
      return (from: Coords, to: Coords, actor: Creature): Coords[] => {
        const matrix = this.tiles.map((row) => {
          return row.map((tile) => {
            if (tile.terrain.blocksMovement || tile.terrain.type === 'lava')
              return 0;
            return 1;
          });
        });

        actor.game.creatures.forEach((creature) => {
          if (coordsEqual(creature, to)) {
            matrix[creature.y][creature.x] = 1;
          } else {
            matrix[creature.y][creature.x] = 0;
          }
        });

        const graph = new Graph(matrix);

        const start = graph.grid[from.y][from.x];
        const end = graph.grid[to.y][to.x];

        return astar.search(graph, start, end);
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
    coordsInBounds() {
      return (coords: Coords) => {
        return (
          coords.x >= 0 &&
          coords.x < this.width &&
          coords.y > 0 &&
          coords.y < this.height
        );
      };
    },
  },
  actions: {
    generate() {
      this.tiles = generate(this.width, this.height);
    },
  },
});

export type TerrainData = Pick<Terrain, 'type' | 'char' | 'color'>;

export class Tile implements Damageable {
  constructor({ x, y, terrain }: Coords & { terrain?: Terrain }) {
    this.x = x;
    this.y = y;
    this.terrain = terrain ?? new Floor();
  }

  readonly x;
  readonly y;
  terrain;

  terrainLastSeenByPlayer?: TerrainData;

  penetrationBlock = 0;

  readonly IMPLEMENTS_DAMAGEABLE = true;

  entities: MapEntity[] = [];

  get blocksView() {
    return this.terrain.blocksView;
  }

  get id() {
    return `${this.x},${this.y}`;
  }

  onPlayerSees() {
    const { type, char, color } = this.terrain;
    this.terrainLastSeenByPlayer = { type, char, color };
  }

  receiveDamage(damage: number) {
    if (!this.isCurrentlyDamageable) return;

    (this.terrain as Wall).receiveDamage(damage);

    if (this.terrain.health <= 0) {
      this.terrain = this.terrain.terrainOnDie as Terrain;
    }
  }

  get isCurrentlyDamageable() {
    return this.terrain instanceof Wall;
  }

  get cover() {
    return this.terrain.cover;
  }

  addEntity(e: MapEntity) {
    this.entities.push(e);
  }

  removeEntity(e: MapEntity) {
    const idx = this.entities.indexOf(e);

    if (idx === -1) return;

    this.entities.splice(idx, 1);
  }
}
