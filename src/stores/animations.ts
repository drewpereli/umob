import type Actor from '@/entities/actor';
import { defineStore } from 'pinia';

const ANIMATION_DURATION = 100;

export abstract class GameAnimation {
  constructor() {
    this.id = `${Math.random()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
  }

  readonly id;
  abstract readonly type: string;

  isRunning = false;
}

export class DamageAnimation extends GameAnimation {
  constructor(actor: Actor) {
    super();

    this.actor = actor;
  }

  type = 'damage';
  actor;
}

export class BulletAnimation extends GameAnimation {
  constructor(from: Coords, to: Coords, hit: boolean) {
    super();
    this.from = from;
    this.to = to;
    this.hit = hit;
  }

  type = 'bullet';
  from;
  to;
  hit;

  beforeDelete = undefined;
}

export const useAnimations = defineStore('animations', {
  state: () => ({
    animations: [] as GameAnimation[],
    isRunning: false,
  }),
  actions: {
    async runAnimations() {
      this.isRunning = true;

      await new Promise((res) => setTimeout(res, ANIMATION_DURATION));

      this.isRunning = false;

      this.animations = [];
    },
    addAnimation(animation: GameAnimation) {
      this.animations.push(animation);
    },
  },
});
