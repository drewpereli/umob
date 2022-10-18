import { Floor, Wall, HalfWall } from '@/entities/terrain';
import { Tile } from '@/stores/map';
import { debugOptions } from './debug-options';
import { random } from './random';

type Map = Tile[][];

export function generate(width: number, height: number): Map {
  if (debugOptions.emptyMap) {
    const map = generateEmpty(width, height);

    if (debugOptions.randomWallsInEmptyMap) {
      const openTiles = map.flatMap((row) => {
        return row.filter((tile) => tile.terrain instanceof Floor);
      });

      const randOpen = random.arrayElements(
        openTiles,
        debugOptions.randomWallsInEmptyMap
      );

      randOpen.forEach((tile) => (tile.terrain = new Wall()));
    }

    if (debugOptions.randomHalfWallsInEmptyMap) {
      const openTiles = map.flatMap((row) => {
        return row.filter((tile) => tile.terrain instanceof Floor);
      });

      const randOpen = random.arrayElements(
        openTiles,
        debugOptions.randomHalfWallsInEmptyMap
      );

      randOpen.forEach((tile) => (tile.terrain = new HalfWall()));
    }

    return map;
  }

  const tileArr = generateLevel({ x: width, y: height }).tiles;

  const map: Map = [];

  tileArr.forEach((row, y) => {
    const mapRow: Tile[] = [];

    row.forEach((terrain, x) => {
      const tile = new Tile({
        x,
        y,
        terrain: terrain === 1 ? new Wall() : new Floor(),
      });

      mapRow.push(tile);
    });

    map.push(mapRow);
  });

  return map;
}

export function generateEmpty(width: number, height: number): Map {
  return Array.from({ length: height }).map((_, y) => {
    return Array.from({ length: width }).map((_, x) => {
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;

      if (onEdge) {
        return new Tile({
          x,
          y,
          terrain: new Wall(),
        });
      } else {
        return new Tile({
          x,
          y,
          terrain: new Floor(),
        });
      }
    });
  });
}

// generate a random level with rooms
// mapSize = level size {x, y}
// maxRooms = max number of rooms to generate (number). note: under some conditions the result will have less rooms than max rooms, for example if we run out of places to place rooms in.
// minRoomSize = min room size (number).
// maxRoomSize = max room size (number).
// base on the concepts found here: https://medium.com/@victorcatalintorac/dungeon-with-rooms-algorithm-for-javascript-ultimate-begginer-guide-ec1489e90314
// author: Ronen Ness.
// feel free to use this for any purpose.
// NOTE: made for a project on http://5mbg.com/.
function generateLevel(
  mapSize: Coords,
  maxRooms = 12,
  minRoomSize = 4,
  maxRoomSize = 14
) {
  interface Room {
    x: number;
    y: number;
    w: number;
    h: number;
    neighbors?: Room[];
  }

  // create empty grid of walls (1 == wall)
  const ret: number[][] = [];
  for (let i = 0; i < mapSize.x; ++i) {
    ret.push([]);
    for (let j = 0; j < mapSize.y; ++j) {
      ret[i].push(1);
    }
  }

  // set a room as floors (0)
  function setFloor(room: Room) {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;
    for (let i = x; i < x + w; ++i) {
      for (let j = y; j < y + h; ++j) {
        ret[i][j] = 0;
      }
    }
  }

  // rooms left to create
  let roomsLeft = maxRooms - 1;

  // check if a given room is valid - don't exit map and don't overlap another room
  function isValid(room: Room) {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // ran out of rooms?
    if (roomsLeft <= 0) {
      return false;
    }

    // check boundaries
    if (x < 0 || x + w >= mapSize.x) {
      return false;
    }
    if (y < 0 || y + h >= mapSize.y) {
      return false;
    }

    // make sure there are no floors, ie not overlapping with another room
    for (let i = x - 1; i < x + w + 1; ++i) {
      for (let j = y - 1; j < y + h + 1; ++j) {
        if (ret[i] && ret[i][j] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  // helper function to random between min and max
  function randMinMax(min: number, max: number) {
    return Math.ceil(Math.random() * (max - min)) + min;
  }

  // method to create a single random room
  function createRandomRoom() {
    const x = Math.floor(Math.random() * (mapSize.x - maxRoomSize - 2)) + 1;
    const y = Math.floor(Math.random() * (mapSize.y - maxRoomSize - 2)) + 1;
    const w = randMinMax(minRoomSize, maxRoomSize);
    const h = randMinMax(minRoomSize, maxRoomSize);
    return { x: x, y: y, w: w, h: h };
  }

  // create first room and set it in map. we'll use it as seed and build from there.
  const room = createRandomRoom();
  setFloor(room);

  // list with all rooms to return
  const allRooms: Room[] = [];

  // list with all doors to return
  const allDoors: { x: number; y: number }[] = [];

  // grow recursively from the seed room until we have enough
  function growMap(lastRoom: Room) {
    // update all rooms list
    allRooms.push(lastRoom);

    // create empty neighbors list for this room
    lastRoom.neighbors = [];

    // direction to create neighbor rooms in
    // note: this method to shuffle arrays is not a good way and shouldn't be use for serious stuff - but its good enough for just 4 items like we have :)
    const directions = ['up', 'down', 'left', 'right'].sort(
      () => 0.5 - Math.random()
    );

    // create neighbors in random order
    for (let i = 0; i < directions.length; ++i) {
      // if ran out of rooms to generate, stop here
      if (roomsLeft <= 0) {
        return;
      }

      // build neighbor room
      switch (directions[i]) {
        // build up room
        case 'up': {
          // make sure we have enough room up
          if (lastRoom.y < minRoomSize + 2) {
            continue;
          }

          // create random width and x
          const width = randMinMax(minRoomSize, maxRoomSize);
          const minX = Math.max(lastRoom.x - (width - 2), 1);
          const maxX = Math.min(
            lastRoom.x + lastRoom.w - 2,
            mapSize.x - minRoomSize - 1
          );
          const x = randMinMax(minX, maxX);

          // create random height and set y based on it
          const height = Math.min(
            randMinMax(minRoomSize, maxRoomSize),
            lastRoom.y - 2
          );
          const y = lastRoom.y - height - 1;

          // create room and make sure its legal
          const room = { x: x, y: y, w: width, h: height };
          if (isValid(room)) {
            // set room + door
            lastRoom.neighbors.push(room);
            setFloor(room);
            const doorX = randMinMax(
              Math.max(lastRoom.x + 1, x),
              Math.min(lastRoom.x + lastRoom.w - 2, x + width - 2)
            );
            const doorY = lastRoom.y - 1;
            ret[doorX][doorY] = 0;
            allDoors.push({ x: doorX, y: doorY });

            // expand recursively with the new room
            roomsLeft--;
            growMap(room);
          }

          break;
        }

        // build down room
        case 'down': {
          // make sure we have enough room down
          if (lastRoom.y + lastRoom.h > mapSize.y - minRoomSize - 2) {
            continue;
          }

          // create random width and x
          const width = randMinMax(minRoomSize, maxRoomSize);
          const minX = Math.max(lastRoom.x - (width - 2), 1);
          const maxX = Math.min(
            lastRoom.x + lastRoom.w - 2,
            mapSize.x - minRoomSize - 1
          );
          const x = randMinMax(minX, maxX);

          // create random height and set y based on it
          const height = Math.min(
            randMinMax(minRoomSize, maxRoomSize),
            mapSize.y - lastRoom.y - lastRoom.h - 2
          );
          const y = lastRoom.y + lastRoom.h + 1;

          // create room and make sure its legal
          const room = { x: x, y: y, w: width, h: height };
          if (isValid(room)) {
            // set room + door
            lastRoom.neighbors.push(room);
            setFloor(room);
            const doorX = randMinMax(
              Math.max(lastRoom.x + 1, x),
              Math.min(lastRoom.x + lastRoom.w - 2, x + width - 2)
            );
            const doorY = y - 1;
            ret[doorX][doorY] = 0;
            allDoors.push({ x: doorX, y: doorY });

            // expand recursively with the new room
            roomsLeft--;
            growMap(room);
          }

          break;
        }

        // build left room
        case 'left': {
          // make sure we have enough room left
          if (lastRoom.x < minRoomSize + 2) {
            continue;
          }

          // create random height and y
          const height = randMinMax(minRoomSize, maxRoomSize);
          const minY = Math.max(lastRoom.y - (height - 2), 1);
          const maxY = Math.min(
            lastRoom.y + lastRoom.h - 2,
            mapSize.y - minRoomSize - 1
          );
          const y = randMinMax(minY, maxY);

          // create random width and set x based on it
          const width = Math.min(
            randMinMax(minRoomSize, maxRoomSize),
            lastRoom.x - 2
          );
          const x = lastRoom.x - width - 1;

          // create room and make sure its legal
          const room = { x: x, y: y, w: width, h: height };
          if (isValid(room)) {
            // set room + door
            lastRoom.neighbors.push(room);
            setFloor(room);
            const doorY = randMinMax(
              Math.max(lastRoom.y + 1, y),
              Math.min(lastRoom.y + lastRoom.h - 2, y + height - 2)
            );
            const doorX = lastRoom.x - 1;
            ret[doorX][doorY] = 0;
            allDoors.push({ x: doorX, y: doorY });

            // expand recursively with the new room
            roomsLeft--;
            growMap(room);
          }

          break;
        }

        // build right room
        case 'right': {
          // make sure we have enough room right
          if (lastRoom.x + lastRoom.w > mapSize.x - minRoomSize - 2) {
            continue;
          }

          // create random height and y
          const height = randMinMax(minRoomSize, maxRoomSize);
          const minY = Math.max(lastRoom.y - (height - 2), 1);
          const maxY = Math.min(
            lastRoom.y + lastRoom.h - 2,
            mapSize.y - minRoomSize - 1
          );
          const y = randMinMax(minY, maxY);

          // create random width and set x based on it
          const width = Math.min(
            randMinMax(minRoomSize, maxRoomSize),
            mapSize.x - lastRoom.x - lastRoom.w - 2
          );
          const x = lastRoom.x + lastRoom.w + 1;

          // create room and make sure its legal
          const room = { x: x, y: y, w: width, h: height };
          if (isValid(room)) {
            // set room + door
            lastRoom.neighbors.push(room);
            setFloor(room);
            const doorY = randMinMax(
              Math.max(lastRoom.y + 1, y),
              Math.min(lastRoom.y + lastRoom.h - 2, y + height - 2)
            );
            const doorX = x - 1;
            ret[doorX][doorY] = 0;
            allDoors.push({ x: doorX, y: doorY });

            // expand recursively with the new room
            roomsLeft--;
            growMap(room);
          }
        }
      }
    }
  }

  // start building rooms
  growMap(room);

  // return grid
  return { tiles: ret, rooms: allRooms, doors: allDoors };
}
