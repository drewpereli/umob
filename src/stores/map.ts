import bresenham from '@/utils/bresenham';
import {
  addElevatorDown,
  addEnemies,
  addItems,
  addRooms,
  generateTilesAndWalls,
  type World,
} from '@/utils/map-generation';
import { defineStore } from 'pinia';
import { debugOptions } from '@/utils/debug-options';
import { random } from '@/utils/random';
import { astar, Graph } from '@/utils/astar';
import { distance, Dir } from '@/utils/map';
import { Tile } from '@/tile';
import type Creature from '@/entities/creatures/creature';
import type { findableItems } from '@/entities/items/findable-items';
import type { allPowers } from '@/powers/all-powers';

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
        const tile = coords instanceof Tile ? coords : this.tileAt(coords);
        return tile.adjacentTiles;
      };
    },
    pathBetween() {
      return (
        from: Coords,
        to: Coords,
        valueForTile?: (tile: Tile) => number
      ): Coords[] => {
        const matrix = this.tiles.map((row) => {
          return row.map((tile) => {
            if (tile.hasEntityThatBlocksMovement) return 0;
            return valueForTile?.(tile) ?? 1;
          });
        });

        matrix[to.y][to.x] = 1; // Set "to" tile to moveable, so we can move towards enemies and stuff

        const graph = new Graph(matrix);

        const start = graph.grid[from.y][from.x];
        const end = graph.grid[to.y][to.x];

        return astar.search(graph, start, end, { closest: true });
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
    generate(
      world: World,
      level: number,
      creatureClasses: typeof Creature[],
      items: typeof findableItems,
      powers: typeof allPowers
    ) {
      const { map, rooms } = generateTilesAndWalls(this.width, this.height);
      this.tiles = map;
      addRooms(map, rooms, world);
      addElevatorDown();

      if (!debugOptions.noItems) {
        addItems(items, powers);
      }

      if (!debugOptions.noEnemies) {
        addEnemies(world, creatureClasses, level);
      }
    },
  },
});
