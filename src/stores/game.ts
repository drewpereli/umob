import { ActionUiState } from '@/utils/action-handlers';
import { PermissiveFov } from 'permissive-fov';
import { defineStore } from 'pinia';
import random from 'random';
import { Floor, Tile, useMap, Wall } from './map';

interface State {
  player: Player;
  actors: Actor[];
  currTime: number;
  map: ReturnType<typeof useMap>;
  fovUtil: PermissiveFov;
  selectedTile: Tile | null;
  actionUiState: ActionUiState;
}

export const useGame = defineStore('game', {
  state: (): State => ({
    player: new Player({ x: 0, y: 0 }),
    actors: [
      // new Actor({ x: 2, y: 4 }),
      // new Actor({ x: 15, y: 14 }),
      // new Actor({ x: 11, y: 10 }),
    ] as Actor[],
    currTime: 0,
    map: useMap(),
    fovUtil: null as unknown as PermissiveFov,
    selectedTile: null,
    actionUiState: ActionUiState.Default,
  }),
  getters: {
    allActors: (state) => [state.player, ...state.actors],
    actorAt() {
      return (coords: Coords) => {
        return this.allActors.find(
          (actor) => actor.x === coords.x && actor.y === coords.y
        );
      };
    },
    visibleTiles() {
      const visibleTiles: Tile[] = [];

      this.fovUtil.compute(
        this.player.x,
        this.player.y,
        10,
        (x: number, y: number) => {
          const tile = this.map.tileAt({ x, y });
          visibleTiles.push(tile);
        }
      );

      return visibleTiles;
    },
    tilesBetweenPlayerAndSelected(): Tile[] {
      const selectedTile = this.selectedTile;

      if (!selectedTile) return [];

      const playerTile = this.map.tileAt(this.player);

      return this.map.tilesBetween(playerTile, selectedTile).slice(1);
    },
    tilesAimedAt(): Tile[] {
      if (this.actionUiState !== ActionUiState.Aiming) return [];

      let penetrationRemaining = this.player.equippedWeapon.penetration;

      const tiles: Tile[] = [];

      const tilesBetween = this.tilesBetweenPlayerAndSelected;

      for (const tile of tilesBetween) {
        tiles.push(tile);

        const actor = this.actorAt(tile);

        penetrationRemaining -= tile.terrain.penetrationBlock;

        if (actor) {
          penetrationRemaining -= actor.penetrationBlock;
        }

        if (penetrationRemaining < 0) break;
      }

      return tiles;
    },
  },
  actions: {
    initialize() {
      this.map.generate();

      // Get random floor tile for player
      const floorTiles = this.map.tiles
        .flat()
        .filter((tile) => tile.terrain instanceof Floor);

      const idx = random.int(0, floorTiles.length - 1);
      const tile = floorTiles[idx];

      this.player.x = tile.x;
      this.player.y = tile.y;

      const fov = new PermissiveFov(
        this.map.width,
        this.map.height,
        (x: number, y: number) => this.map.tileAt({ x, y }).isTransparent
      );

      this.fovUtil = fov;
    },
    movePlayer({ x, y }: { x?: number; y?: number }) {
      const targetCoords: Coords = {
        x: this.player.x + (x ?? 0),
        y: this.player.y + (y ?? 0),
      };

      if (this.actorAt(targetCoords)) return;

      const targetTile = this.map.tileAt(targetCoords);

      if (!targetTile) return;

      if (!targetTile.canMoveTo) return;

      this.player.move(targetTile);

      while (!this.player.canAct) {
        this.actors.forEach((actor) => actor.act(this));
        this._tick();
      }
    },
    _tick() {
      this.allActors.forEach((actor) => actor.tick());
      this.currTime++;
    },
  },
});

class Actor {
  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  x;
  y;

  moveTime = 10;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  char = 'd';
  readonly color: string = 'white';

  move(tile: Tile) {
    if (!this.canAct) return;

    this.x = tile.x;
    this.y = tile.y;
    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
    }
  }

  get canAct() {
    return this.timeUntilNextAction === 0;
  }

  act(state: {
    actorAt: (coords: { x: number; y: number }) => Actor | undefined;
    map: ReturnType<typeof useMap>;
  }) {
    const x = random.int(0, 1) * 2 - 1;
    const y = random.int(0, 1) * 2 - 1;
    const coords = { x: this.x + x, y: this.y + y };

    if (state.actorAt(coords)) return;

    const tile = state.map.tileAt(coords);

    if (!tile) return;

    if (!tile.canMoveTo) return;

    this.move(tile);
  }

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }
}

class Player extends Actor {
  char = '@';
  color = 'yellow';
  inventory = [new Gun()];
  equippedWeapon = this.inventory[0];
}

class Gun {
  damage = 10;
  penetration = 0;
}
