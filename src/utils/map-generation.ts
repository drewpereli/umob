import { Floor, Tile, Wall } from '@/stores/map';

type Map = Tile[][];

export function generate(width: number, height: number): Map {
  const map = initializeFloors(width, height);

  const mapTransformers: Array<(map: Map) => Map> = [addPermitterWalls];

  return mapTransformers.reduce((currMap, fn) => fn(currMap), map);
}

// Create a width * height map of all floor tiles
function initializeFloors(width: number, height: number): Map {
  return Array.from({ length: height }).map((_, y) => {
    return Array.from({ length: width }).map((_, x) => {
      return new Tile({ x, y, terrain: new Floor() });
    });
  });
}

// Update the map so that each edge tile is a wall
function addPermitterWalls(map: Map): Map {
  const width = map[0].length;
  const height = map.length;

  const coordsToUpdate: Coords[] = [
    ...Array.from({ length: width }).map((_, x) => ({ x, y: 0 })),
    ...Array.from({ length: width }).map((_, x) => ({ x, y: height - 1 })),
    ...Array.from({ length: height }).map((_, y) => ({ x: 0, y })),
    ...Array.from({ length: width }).map((_, y) => ({ x: width - 1, y })),
  ];

  coordsToUpdate.forEach((coord) => {
    map[coord.y][coord.x].terrain = new Wall();
  });

  return map;
}
