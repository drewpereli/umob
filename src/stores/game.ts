import { defineStore } from 'pinia';
import random from 'random';

export const useGame = defineStore('game', {
  state: () => ({
    player: new Player({ x: 10, y: 10 }),
    actors: [
      new Actor({ x: 2, y: 4 }),
      new Actor({ x: 15, y: 14 }),
      new Actor({ x: 11, y: 10 }),
    ],
    currTime: 0,
  }),
  getters: {
    allActors: (state) => [state.player, ...state.actors],
    tileHasActor() {
      return ({ x, y }: { x: number; y: number }) => {
        return this.allActors.some((actor) => actor.x === x && actor.y === y);
      };
    },
  },
  actions: {
    move({ x, y }: { x?: number; y?: number }) {
      if (
        this.tileHasActor({
          x: this.player.x + (x ?? 0),
          y: this.player.y + (y ?? 0),
        })
      )
        return;

      this.player.move({ x, y });

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

  move({ x, y }: { x?: number; y?: number }) {
    if (!this.canAct) return;

    this.x += x ?? 0;
    this.y += y ?? 0;
    this.timeUntilNextAction = this.moveTime;
  }

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
    }
  }

  get canAct() {
    return this.timeUntilNextAction === 0;
  }

  act(state: { tileHasActor: (coords: { x: number; y: number }) => boolean }) {
    const x = random.int(0, 1) * 2 - 1;
    const y = random.int(0, 1) * 2 - 1;

    if (state.tileHasActor({ x: this.x + x, y: this.y + y })) return;

    this.move({ x, y });
  }
}

class Player extends Actor {
  char = '@';
}
