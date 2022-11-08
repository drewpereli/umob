import {
  CondensedSteamGenerator,
  Door,
  ElevatorDown,
  isDoor,
  RadSpitter,
  RadSpitterButtonWall,
  Ruble,
} from '@/entities/terrain';
import { Lava, ToxicWaste } from '@/entities/fluid';
import { Wall, HalfWall } from '@/entities/terrain';
import { useGame } from '@/stores/game';
import { debugOptions } from './debug-options';
import { random } from './random';
import { Centrifuge } from '@/entities/centrifuge';
import { Dir, DIRS } from './map';
import { CentrifugeTerminal } from '@/entities/controller/centrifuge-terminal';
import { Tile } from '@/tile';
import { useMap } from '@/stores/map';
import type Creature from '@/entities/creatures/creature';
import { ItemInMap } from '@/entities/items/item-in-map';
import type { findableItems } from '@/entities/items/findable-items';
import type { allPowers } from '@/powers/all-powers';
import { Usable } from '@/entities/items/usable';

type Map = Tile[][];

const WORLDS = [
  'radiation-lab',
  'refinery',
  'zoo',
  'psych-lab',
  'physics-lab',
] as const;

export type World = typeof WORLDS[number];

export function generateTilesAndWalls(
  width: number,
  height: number
): { map: Map; rooms: Room[] } {
  const game = useGame();

  if (debugOptions.emptyMap) {
    const map = generateEmpty(width, height);

    if (debugOptions.randomWallsInEmptyMap) {
      const openTiles = map.flatMap((row) => {
        return row.filter((tile) => !tile.terrain);
      });

      const randOpen = random.arrayElements(
        openTiles,
        debugOptions.randomWallsInEmptyMap
      );

      randOpen.forEach((tile) => game.addMapEntity(new Wall(tile)));
    }

    if (debugOptions.randomHalfWallsInEmptyMap) {
      const openTiles = map.flatMap((row) => {
        return row.filter((tile) => !tile.terrain);
      });

      const randOpen = random.arrayElements(
        openTiles,
        debugOptions.randomHalfWallsInEmptyMap
      );

      randOpen.forEach((tile) => game.addMapEntity(new HalfWall(tile)));
    }

    if (debugOptions.randomLavaInEmptyMap) {
      const openTiles = map.flatMap((row) => {
        return row.filter((tile) => !tile.terrain);
      });

      const randOpen = random.arrayElements(
        openTiles,
        debugOptions.randomLavaInEmptyMap
      );

      randOpen.forEach((tile) => game.addMapEntity(new Lava(tile)));
    }

    setAdjacentTiles(map);

    return {
      map,
      rooms: [
        {
          x: 1,
          y: 1,
          w: width - 2,
          h: height - 2,
        },
      ],
    };
  }

  const { tiles: tileArr, rooms } = generateLevel({ x: width, y: height });

  const map: Map = [];

  tileArr.forEach((row, y) => {
    const mapRow: Tile[] = [];

    row.forEach((terrain, x) => {
      const tile = new Tile({
        x,
        y,
      });

      mapRow.push(tile);

      if (terrain === 1) {
        game.addMapEntity(new Wall(tile));
      }
    });

    map.push(mapRow);
  });

  const thresholds = map.flatMap((row, y) => {
    return row.filter((tile, x) => {
      if (tile.terrain) return;

      const up = map[y - 1][x];
      const right = map[y][x + 1];
      const down = map[y + 1][x];
      const left = map[y][x - 1];

      if (
        up.terrain?.blocksMovement &&
        down.terrain?.blocksMovement &&
        !left.terrain &&
        !right.terrain
      ) {
        return true;
      }

      if (
        left.terrain?.blocksMovement &&
        right.terrain?.blocksMovement &&
        !up.terrain &&
        !down.terrain
      ) {
        return true;
      }

      return false;
    });
  });

  thresholds.forEach((tile) => {
    const door = new Door(tile);
    game.addMapEntity(door);
  });

  setAdjacentTiles(map);

  return { map, rooms };
}

export function addRooms(map: Map, rooms: Room[], world: World) {
  const roomGeneratorsForWorld = roomGenerators.filter((gen) => {
    return (
      gen.worldRestrictions.length === 0 ||
      gen.worldRestrictions.includes(world)
    );
  });

  if (debugOptions.emptyMap) {
    if (debugOptions.roomWhenEmptyMap) {
      const roomGen = roomGeneratorsForWorld.find(
        (g) => g.name === debugOptions.roomWhenEmptyMap
      );

      if (!roomGen) {
        throw new Error(
          `No room generator named "${debugOptions.roomWhenEmptyMap}"`
        );
      }

      const g = new roomGen(rooms[0], map);
      g.generate();
    }

    return;
  }

  const roomGenWeights = roomGeneratorsForWorld.map((g) => g.genChance);

  rooms.forEach((room) => {
    const roomGen = random.weightedArrayElement(
      roomGeneratorsForWorld,
      roomGenWeights
    );

    const g = new roomGen(room, map);

    g.generate();
  });
}

export function addItems(
  items: typeof findableItems,
  powers: typeof allPowers
) {
  const itemCount = random.int(5, 10);

  for (let i = 0; i < itemCount; i++) {
    let item;

    if (random.bool()) {
      const itemCategory = items.randValue();
      const itemClass = random.arrayElement(itemCategory);
      // @ts-ignore
      item = new itemClass();
    } else {
      const powerClass = random.arrayElement(
        powers.filter((p) => p.foundInUsables)
      );
      item = new Usable(powerClass);
    }

    const tile = useMap().randomFloorTile();

    const itemInMap = new ItemInMap(tile, item);

    useGame().addMapEntity(itemInMap);
  }
}

export function addEnemies(
  world: World,
  creatureClasses: typeof Creature[],
  level: number
) {
  const game = useGame();
  const map = useMap();

  const enemyGroupCount = random.int(4 + level, 6 + level);

  const creaturesForWorld = creatureClasses.filter((creature) => {
    return (
      (creature.worldRestrictions.length === 0 ||
        creature.worldRestrictions.includes(world)) &&
      !creature.boss
    );
  });

  const creatureGenWeights = creaturesForWorld.map((g) => g.genChance);

  for (let i = 0; i < enemyGroupCount; i++) {
    const creatureClass = random.weightedArrayElement(
      creatureClasses,
      creatureGenWeights
    );

    const count = creatureClass.groupSize
      ? random.int(creatureClass.groupSize[0], creatureClass.groupSize[1] + 1)
      : 1;

    const tile = map.randomFloorTile();

    const tiles = breadthFirstFloodFill(
      tile,
      (t) => game.creatureCanOccupy(t),
      count
    );

    tiles.forEach((t) => {
      // @ts-ignore
      const creature = new creatureClass(t);
      game.addMapEntity(creature);
    });
  }

  return;
}

function generateEmpty(width: number, height: number): Map {
  const game = useGame();

  return Array.from({ length: height }).map((_, y) => {
    return Array.from({ length: width }).map((_, x) => {
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;

      if (onEdge) {
        const tile = new Tile({
          x,
          y,
        });

        const wall = new Wall(tile);

        game.addMapEntity(wall);

        return tile;
      } else {
        return new Tile({
          x,
          y,
        });
      }
    });
  });
}

function setAdjacentTiles(map: Map) {
  map.forEach((row, y) => {
    row.forEach((tile, x) => {
      const adjacent: Tile[] = [
        map[y - 1]?.[x],
        map[y + 1]?.[x],
        map[y]?.[x - 1],
        map[y]?.[x + 1],
      ].filter((t) => !!t);

      tile.adjacentTiles = adjacent;
    });
  });
}

export function addElevatorDown() {
  const map = useMap();

  const tile = map.randomFloorTile();

  const elevatorDown = new ElevatorDown(tile);

  const game = useGame();

  game.addMapEntity(elevatorDown);
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  neighbors?: Room[];
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
  maxRooms = 8,
  minRoomSize = 8,
  maxRoomSize = 15
) {
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
  const allDoors: Coords[] = [];

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

  const rooms: Room[] = allRooms.map((room) => {
    return {
      x: room.y,
      y: room.x,
      w: room.h,
      h: room.w,
    };
  });

  // return grid
  return { tiles: ret, rooms, doors: allDoors };
}

type CornerType = 'tl' | 'tr' | 'bl' | 'br';

interface Corner {
  tile: Tile;
  type: CornerType;
}

abstract class RoomGenerator {
  constructor(public room: Room, public map: Map) {
    this.w = this.room.w;
    this.h = this.room.h;
    this.area = this.w * this.h;
  }

  w;
  h;
  area;

  abstract generate(): void;

  static worldRestrictions: World[] = [];
  static genChance: number;

  get tiles(): Tile[][] {
    return this.map.slice(this.room.y, this.room.y + this.room.h).map((row) => {
      return row.slice(this.room.x, this.room.x + this.room.w);
    });
  }

  get tilesFlat() {
    return this.tiles.flat();
  }

  get centerTile() {
    const centerCoords = {
      x: Math.round(this.room.w / 2),
      y: Math.round(this.room.h / 2),
    };

    const centerTile = this.tiles[centerCoords.y][centerCoords.x];

    return centerTile;
  }

  get corners(): Corner[] {
    return [
      { tile: this.tiles[0][0], type: 'tl' },
      { tile: this.tiles[0][this.w - 1], type: 'tr' },
      { tile: this.tiles[this.h - 1][0], type: 'bl' },
      { tile: this.tiles[this.h - 1][this.w - 1], type: 'br' },
    ];
  }

  get tilesNextToDoors(): Tile[] {
    return this.tiles.flatMap((row) => {
      return row.filter((tile) => {
        return this.game.map
          .adjacentTiles(tile)
          .some((adj) => adj.entities.some((ent) => isDoor(ent)));
      });
    });
  }

  get nonCornerWallInfo(): Record<Dir, Tile[]> {
    const top = this.map[this.room.y - 1].slice(
      this.room.x,
      this.room.x + this.room.w
    );

    const bottom = this.map[this.room.y + this.room.h].slice(
      this.room.x,
      this.room.x + this.room.w
    );

    const left = this.map
      .slice(this.room.y, this.room.y + this.room.h)
      .map((tiles) => tiles[this.room.x - 1]);

    const right = this.map
      .slice(this.room.y, this.room.y + this.room.h)
      .map((tiles) => tiles[this.room.x + this.room.w]);

    return {
      [Dir.Up]: bottom.filter((t) => t.terrain instanceof Wall),
      [Dir.Right]: left.filter((t) => t.terrain instanceof Wall),
      [Dir.Down]: top.filter((t) => t.terrain instanceof Wall),
      [Dir.Left]: right.filter((t) => t.terrain instanceof Wall),
    };
  }

  get game() {
    return useGame();
  }
}

class CentrifugeRoom extends RoomGenerator {
  static worldRestrictions: World[] = ['radiation-lab', 'physics-lab'];
  static genChance = 0.1;

  generate() {
    const minDimension = Math.min(this.room.w, this.room.h);

    const centrifugeLength = Math.round(minDimension / 2) - 1.5;

    const centrifuge = new Centrifuge(this.centerTile, true, centrifugeLength);

    this.game.addMapEntity(centrifuge);

    const cornersNotNextToDoor = this.corners.filter((corner) => {
      return !this.tilesNextToDoors.includes(corner.tile);
    });

    if (cornersNotNextToDoor.length === 0) {
      return;
    }

    const corner = random.arrayElement(cornersNotNextToDoor);

    const possibleDirsFromCornerType: Record<CornerType, Dir[]> = {
      tl: [Dir.Right, Dir.Down],
      tr: [Dir.Left, Dir.Down],
      bl: [Dir.Up, Dir.Right],
      br: [Dir.Up, Dir.Left],
    };

    const terminalFacing = random.arrayElement(
      possibleDirsFromCornerType[corner.type]
    );

    const controller = new CentrifugeTerminal(
      corner.tile,
      [centrifuge],
      terminalFacing
    );

    this.game.addMapEntity(controller);
  }
}

class RadPoolRoom extends RoomGenerator {
  static worldRestrictions: World[] = ['radiation-lab'];
  static genChance = 0.1;

  generate() {
    const countMax = Math.max(Math.round(this.area / 80), 1);
    const tileCount = random.int(1, countMax + 1);

    Array.from({ length: tileCount }).forEach(() => {
      const tilesWithoutFluid = this.tilesFlat.filter((tile) => !tile.fluid);

      if (tilesWithoutFluid.length === 0) return;

      const tile = random.arrayElement(tilesWithoutFluid);

      const pressure = random.int(3, 6);
      const waste = new ToxicWaste(tile, pressure);

      this.game.addMapEntity(waste);
    });
  }
}

class CondensedSteamGeneratorRoom extends RoomGenerator {
  static genChance = 0.1;

  generate() {
    const countMax = Math.max(Math.round(this.area / 80), 1);
    const count = random.int(1, countMax + 1);

    for (let i = 0; i < count; i++) {
      const dir = random.arrayElement(DIRS);

      const tiles = this.nonCornerWallInfo[dir];

      const tile = random.arrayElement(tiles);

      if (!tile) continue;

      const g = new CondensedSteamGenerator(tile, dir);

      this.game.addMapEntity(g);
    }
  }
}

class RoomWithRuble extends RoomGenerator {
  static genChance = 0.3;

  generate() {
    const rubleCount = random.int(2, Math.round(this.area / 10) + 2);

    for (let i = 0; i < rubleCount; i++) {
      const floorTiles = this.tilesFlat.filter((t) => !t.terrain);

      const tile = random.arrayElement(floorTiles);

      const ruble = new Ruble(tile);

      useGame().addMapEntity(ruble);
    }
  }
}

class RadSpitterButtonRoom extends RoomGenerator {
  static worldRestrictions: World[] = ['radiation-lab'];
  static genChance = 0.1;

  generate() {
    const countMax = Math.max(Math.round(this.area / 40), 1);
    const count = random.int(1, countMax + 1);

    const spitters: RadSpitter[] = [];

    for (let i = 0; i < count; i++) {
      const dir = random.arrayElement(DIRS);

      const tiles = this.nonCornerWallInfo[dir];

      const tile = random.arrayElement(tiles);

      if (!tile) continue;

      this.game.immediatelyRemoveMapEntity(tile.terrain as Wall);

      const g = new RadSpitter(tile, dir, false);

      this.game.addMapEntity(g);

      spitters.push(g);
    }

    const dir = random.arrayElement(DIRS);

    const tiles = this.nonCornerWallInfo[dir];

    const tile = random.arrayElement(tiles);

    this.game.immediatelyRemoveMapEntity(tile.terrain as Wall);

    const buttonWall = new RadSpitterButtonWall(tile, spitters, dir);

    useGame().addMapEntity(buttonWall);
  }
}

class AutoRadSpitterRoom extends RoomGenerator {
  static worldRestrictions: World[] = ['radiation-lab'];
  static genChance = 0.1;

  generate() {
    const countMax = Math.max(Math.round(this.area / 40), 1);
    const count = random.int(1, countMax + 1);

    const spitters: RadSpitter[] = [];

    for (let i = 0; i < count; i++) {
      const dir = random.arrayElement(DIRS);

      const tiles = this.nonCornerWallInfo[dir];

      const tile = random.arrayElement(tiles);

      if (!tile) continue;

      this.game.immediatelyRemoveMapEntity(tile.terrain as Wall);

      const g = new RadSpitter(tile, dir);

      this.game.addMapEntity(g);

      spitters.push(g);
    }
  }
}

const roomGenerators = [
  CentrifugeRoom,
  RadPoolRoom,
  CondensedSteamGeneratorRoom,
  RoomWithRuble,
  RadSpitterButtonRoom,
  AutoRadSpitterRoom,
];

function breadthFirstFloodFill(
  start: Tile,
  tileValid: (tile: Tile) => boolean,
  maxCount = Infinity
) {
  const inspected: Tile[] = [];
  const toInsect: Tile[] = [start];

  while (toInsect.length && inspected.length < maxCount) {
    const tile = toInsect.shift() as Tile;

    if (!tileValid(tile)) continue;

    inspected.push(tile);

    toInsect.push(...tile.adjacentTiles.filter(tileValid));
  }

  return inspected;
}
