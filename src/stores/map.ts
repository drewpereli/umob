import bresenham from '@/utils/bresenham';
import { generate } from '@/utils/map-generation';
import { defineStore } from 'pinia';
import type Creature from '@/entities/creatures/creature';
import { debugOptions } from '@/utils/debug-options';
import { random } from '@/utils/random';
import { astar, Graph } from '@/utils/astar';
import { distance, coordsEqual, Dir, Cover, DIRS } from '@/utils/map';
import { isTerrain, type Terrain } from '@/entities/terrain';
import type MapEntity from '@/entities/map-entity';
import { isFluid, type Fluid } from '@/entities/fluid';
import { isGas, type Gas } from '@/entities/gas';
import { isItemInMap, type ItemInMap } from '@/entities/items/item-in-map';

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
    adjacentTiles() {
      return (coords: Coords): Tile[] => {
        return DIRS.map((dir) => this.adjacentTile(coords, dir)).filter(
          (t): t is Tile => !!t
        );
      };
    },
    pathBetween() {
      return (from: Coords, to: Coords, actor: Creature): Coords[] => {
        const matrix = this.tiles.map((row) => {
          return row.map((tile) => {
            if (tile.hasEntityThatBlocksView || tile.terrain?.type === 'lava')
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
          .filter((tile) => !tile.terrain);

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

export const FLOOR_TERRAIN_DATA: TerrainData = {
  type: 'floor',
  char: '•',
  color: 'rgba(255,255,255,0.2)',
};

export class Tile {
  constructor({ x, y }: Coords) {
    this.x = x;
    this.y = y;
  }

  readonly x;
  readonly y;

  terrainLastSeenByPlayer?: TerrainData;

  get moveTimeMultiplier() {
    const terrainMultiplier = this.terrain
      ? this.terrain.moveTimeMultiplier
      : 1;

    if (terrainMultiplier === null) {
      return null;
    }

    const fluidMultiplier = this.fluid?.moveTimeMultiplier ?? 1;

    return terrainMultiplier * fluidMultiplier;
  }

  get hasEntityThatBlocksMovement() {
    return this.entities.some((e) => e.blocksMovement);
  }

  get hasEntityThatBlocksView() {
    return this.entities.some((e) => e.blocksView);
  }

  get terrain() {
    return this.entities.find(isTerrain);
  }

  readonly IMPLEMENTS_DAMAGEABLE = true;

  entities: MapEntity[] = [];

  get id() {
    return `${this.x},${this.y}`;
  }

  onPlayerSees() {
    const terrain = this.terrain ?? FLOOR_TERRAIN_DATA;

    this.terrainLastSeenByPlayer = {
      type: terrain.type,
      char: terrain.char,
      color: terrain.color,
    };
  }

  get cover() {
    return this.terrain?.cover ?? Cover.None;
  }

  get fluid(): Fluid | undefined {
    return this.entities.find(isFluid);
  }

  get gas(): Gas | undefined {
    return this.entities.find(isGas);
  }

  get items(): ItemInMap[] {
    return this.entities.filter(isItemInMap);
  }

  addEntity(e: MapEntity) {
    this.entities.push(e);

    // if (e.blocksMovement) {
    //   this.hasEntityThatBlocksMovement = true;
    // }

    // if (e.blocksView) {
    //   this.hasEntityThatBlocksView = true;
    // }

    // if (isTerrain(e)) {
    //   this.terrain = e;
    //   this.moveTimeMultiplier = e.moveTimeMultiplier;
    // }
  }

  removeEntity(e: MapEntity) {
    const idx = this.entities.indexOf(e);

    if (idx === -1) return;

    this.entities.splice(idx, 1);

    // if (e === this.terrain) {
    //   this.terrain === undefined;
    //   this.moveTimeMultiplier = 1;
    // }

    // if (e.blocksMovement) {
    //   this.hasEntityThatBlocksMovement = this.entities.some(
    //     (entity) => entity.blocksMovement
    //   );
    // }

    // if (e.blocksView) {
    //   this.hasEntityThatBlocksView = this.entities.some(
    //     (entity) => entity.blocksView
    //   );
    // }
  }
}
