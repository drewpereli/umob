import { defineStore } from 'pinia';
import random from 'random';
import { Tile, useMap } from './map';

export const useGame = defineStore('game', {
  state: () => ({
    player: new Player({ x: 10, y: 10 }),
    actors: [
      new Actor({ x: 2, y: 4 }),
      new Actor({ x: 15, y: 14 }),
      new Actor({ x: 11, y: 10 }),
    ] as Actor[],
    currTime: 0,
    map: useMap(),
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
  },
  actions: {
    initialize() {
      this.map.generate();
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

  char = 'd';

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
}

class Player extends Actor {
  char = '@';
}
