import { Floor, Tile, Wall } from '@/stores/map';
import random from 'random';

type Map = Tile[][];

export function generate(width: number, height: number): Map {
  const map = initializeWalls(width, height);

  const mapTransformers: Array<(map: Map) => Map> = [
    // addPermitterWalls,
    addRooms,
  ];

  return mapTransformers.reduce((currMap, fn) => fn(currMap), map);
}

// Create a width * height map of all wall tiles
function initializeWalls(width: number, height: number): Map {
  return Array.from({ length: height }).map((_, y) => {
    return Array.from({ length: width }).map((_, x) => {
      return new Tile({ x, y, terrain: new Wall() });
    });
  });
}

// // Update the map so that each edge tile is a wall
// function addPermitterWalls(map: Map): Map {
//   const width = map[0].length;
//   const height = map.length;

//   const coordsToUpdate: Coords[] = [
//     ...Array.from({ length: width }).map((_, x) => ({ x, y: 0 })),
//     ...Array.from({ length: width }).map((_, x) => ({ x, y: height - 1 })),
//     ...Array.from({ length: height }).map((_, y) => ({ x: 0, y })),
//     ...Array.from({ length: width }).map((_, y) => ({ x: width - 1, y })),
//   ];

//   coordsToUpdate.forEach((coord) => {
//     map[coord.y][coord.x].terrain = new Wall();
//   });

//   return map;
// }

// Takes a map of all wall tiles and adds rooms and hallways
function addRooms(map: Map): Map {
  const width = map[0].length;
  const height = map.length;

  const roomCount = random.int(5, 10);

  // Store the top-right and bottom-left coords of each room, so we can connect the hallways
  const roomCoords: {tl: Coords, br: Coords}[] = [];

  for (let i = 0; i < roomCount; i++) {
    const roomTopLeft: Coords = {
      x: random.int(1, width - 6),
      y: random.int(1, height - 6),
    };

    const roomBottomRight = {
      x: roomTopLeft.x + random.int(5, 20),
      y: roomTopLeft.y + random.int(5, 20),
    };

    roomCoords.push({tl: roomTopLeft, br: roomBottomRight});

    for (let roomX = roomTopLeft.x; roomX < roomBottomRight.x; roomX++) {
      for (let roomY = roomTopLeft.y; roomY < roomBottomRight.y; roomY++) {
        const coords = { x: roomX, y: roomY };

        if (coordsOnEdge(map, coords)) continue;
        if (!coordsInBounds(map, coords)) continue;

        map[roomY][roomX].terrain = new Floor();
      }
    }
  }
}

function createHallways(map: Map, start: Coords, end: Coords): Map {
  const xStart = Math.min(start.x, end.x);
  const xEnd = Math.max(start.x, end.x);

  for (let x = xStart ; x <= xEnd; x++)  {
    map[start.y][x].terrain = new Floor();
  }

  for (let y = start.y ; y <= end.y ; y)
}

function coordsOnEdge(map: Map, { x, y }: Coords): boolean {
  return x === 0 || y === 0 || x === map[0].length - 1 || y === map.length - 1;
}

function coordsInBounds(map: Map, { x, y }: Coords): boolean {
  return x >= 0 && y >= 0 && x < map[0].length && y < map.length;
}
