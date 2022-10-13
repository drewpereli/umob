import type Actor from '@/entities/actor';
import { defineStore } from 'pinia';

const ANIMATION_DURATION = 1000;

export abstract class GameAnimation {
  constructor() {
    this.id = `${Math.random()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
  }

  readonly id;
  abstract readonly type: string;

  isRunning = false;

  abstract beforeDelete(): void;
}

export class DamageAnimation extends GameAnimation {
  constructor(actor: Actor) {
    super();

    this.actor = actor;

    actor.animations.push(this);
  }

  type = 'damage';
  actor;

  beforeDelete() {
    this.actor.animations = this.actor.animations.filter(
      (animation) => animation.id !== this.id
    );
  }
}

export const useAnimations = defineStore('animations', {
  state: () => ({
    animations: [] as GameAnimation[],
  }),
  actions: {
    async runAnimations() {
      this.animations.forEach((animation) => (animation.isRunning = true));

      await new Promise((res) => setTimeout(res, ANIMATION_DURATION));

      this.animations.forEach((animation) => {
        animation.isRunning = false;
        animation?.beforeDelete();
      });

      this.animations = [];
    },
    addAnimation(animation: GameAnimation) {
      this.animations.push(animation);
    },
  },
});
