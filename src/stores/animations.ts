import type Creature from '@/entities/creatures/creature';
import bresenham from '@/utils/bresenham';
import { CELL_LENGTH, clearRect, fillRect, fillText } from '@/utils/canvas';
import { polarity, slopeIntercept } from '@/utils/math';
import { random } from '@/utils/random';
import { defineStore } from 'pinia';
import { useCamera } from './camera';
import chroma from 'chroma-js';
import { distance } from '@/utils/map';

function coordsInRadius(center: Coords, radius: number) {
  const xStart = center.x - radius;
  const xEnd = center.x + radius;
  const yStart = center.y - radius;
  const yEnd = center.y + radius;

  const coords: Coords[] = [];

  for (let x = xStart; x <= xEnd; x++) {
    for (let y = yStart; y <= yEnd; y++) {
      const dist = distance(center, { x, y });

      if (dist <= radius) coords.push({ x, y });
    }
  }

  return coords;
}

export abstract class GameAnimation {
  constructor() {
    this.id = `${Math.random()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
  }

  readonly id;
  abstract readonly type: string;

  isRunning = false;
  camera = useCamera();

  blocking = true; // Whether we wait for the animation to finish before resuming the game, taking use input, etc

  abstract run(ctxs: Record<string, CanvasRenderingContext2D>): Promise<void>;
}

export class DamageAnimation extends GameAnimation {
  constructor(actor: Creature) {
    super();

    this.actor = actor;
  }

  type = 'damage';
  actor;

  async run(ctxs: Record<string, CanvasRenderingContext2D>) {
    const ctx = ctxs[this.actor.layer];

    const actor = this.actor;

    const position = this.camera.viewCoordsForAbsCoords(actor);

    for (let i = 0; i < 4; i++) {
      const color = i % 2 === 1 ? this.actor.color : 'red';
      fillText(ctx, actor.char, position, color);
      await new Promise((res) => setTimeout(res, 50));
    }
  }
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

  blocking = false;

  async run(ctxs: Record<string, CanvasRenderingContext2D>) {
    const ctx = ctxs.animationObjects;

    const from = this.camera.viewCoordsForAbsCoords(this.from);

    const pxFrom = {
      x: from.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: from.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    const to = this.camera.viewCoordsForAbsCoords(this.to);

    const pxToIfHit = {
      x: to.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: to.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    // Add a little variation to where the bullet actually goes.
    // If the shot was a miss, add more variation
    let randomOffset: Coords;

    if (this.hit) {
      randomOffset = {
        x: random.int(-10, 10),
        y: random.int(-10, 10),
      };
    } else {
      randomOffset = {
        x: random.polarity() * random.int(10, 16),
        y: random.polarity() * random.int(10, 16),
      };
    }

    pxToIfHit.x += randomOffset.x;
    pxToIfHit.y += randomOffset.y;

    const { m, b } = slopeIntercept(pxFrom, pxToIfHit);

    // If the shot was a miss, calculate a pxTo that's further from the original, so the bullet goes past the target
    let pxTo;

    if (this.hit) {
      pxTo = pxToIfHit;
    } else {
      // If the target is directly above/below the shooter
      if (m === Infinity) {
        const yPolarity = polarity(pxFrom.y, pxToIfHit.y);
        pxTo = {
          x: pxToIfHit.x,
          y: pxToIfHit.y + 1000 * yPolarity,
        };
      } else {
        const xPolarity = polarity(pxFrom.x, pxToIfHit.x);
        const newX = pxToIfHit.x + 1000 * xPolarity;
        pxTo = {
          x: newX,
          y: m * newX + b,
        };
      }
    }

    const bulletLength = 5;

    // Subtract half the bullet length from the pixel coordinates, so that the pixels are in the middle
    pxTo.x -= Math.round(bulletLength / 2);
    pxTo.y -= Math.round(bulletLength / 2);
    pxFrom.x -= Math.round(bulletLength / 2);
    pxFrom.y -= Math.round(bulletLength / 2);

    // Include every 10th pixel in the line
    const pixelsInLine = bresenham(pxFrom, pxTo).filter(
      (p, idx) => idx % 20 === 0
    );

    for (const px of pixelsInLine) {
      ctx.fillStyle = 'white';
      ctx.fillRect(px.x, px.y, bulletLength, bulletLength);
      await new Promise((res) => setTimeout(res, 5));
      ctx.clearRect(px.x, px.y, bulletLength, bulletLength);
    }
  }
}

export class ExplosionAnimation extends GameAnimation {
  constructor(at: Coords, radius: number) {
    super();
    this.at = at;
    this.radius = radius;
  }

  type = 'explosion';

  at;
  radius;

  async run(ctxs: Record<string, CanvasRenderingContext2D>) {
    const ctx = ctxs.animationObjects;

    const position = this.camera.viewCoordsForAbsCoords(this.at);

    const frameCount = 10;

    const frameOpacities = Array.from({ length: 10 }).map((_, idx) => {
      const frameFraction = idx / (frameCount - 1);

      return 1 - frameFraction;
    });

    const coordsSet = coordsInRadius(position, this.radius);

    const colorScale = chroma.scale(['red', 'orange']);

    for (const opacity of frameOpacities) {
      coordsSet.forEach((coords) => {
        const actualColor = colorScale(random.float()).alpha(opacity).css();
        fillRect(ctx, coords, actualColor);
      });

      await new Promise((res) => setTimeout(res, 20));

      coordsSet.forEach((coords) => {
        clearRect(ctx, coords);
      });
    }
  }
}

export class KnockBackAnimation extends GameAnimation {
  constructor(
    private actor: Creature,
    private from: Coords,
    private to: Coords,
    private hitSomething: boolean
  ) {
    super();
  }

  type = 'knock-back';

  async run(ctxs: Record<string, CanvasRenderingContext2D>) {
    const ctx = ctxs.animationObjects;

    const from = this.camera.viewCoordsForAbsCoords(this.from);
    const to = this.camera.viewCoordsForAbsCoords(this.to);

    const fromPx = {
      x: from.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: from.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    const toPx = {
      x: to.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: to.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    const frames = 10;

    const coordsByFrames = Array.from({ length: frames }).map((_, idx) => {
      const fraction = (idx + 1) / frames;

      const xDiff = toPx.x - fromPx.x;
      const yDiff = toPx.y - fromPx.y;

      const x = Math.round(fromPx.x + xDiff * fraction);
      const y = Math.round(fromPx.y + yDiff * fraction);

      return { x, y };
    });

    clearRect(ctx, from);

    for (const coords of coordsByFrames) {
      ctx.fillStyle = this.actor.color;
      ctx.fillText(this.actor.char, coords.x, coords.y);
      await new Promise((res) => setTimeout(res, 10));
      ctx.clearRect(
        coords.x - CELL_LENGTH / 2,
        coords.y - CELL_LENGTH / 2,
        CELL_LENGTH,
        CELL_LENGTH
      );
    }
  }
}

export const useAnimations = defineStore('animations', {
  state: () => ({
    animations: [] as GameAnimation[],
    ctxs: null as null | Record<string, CanvasRenderingContext2D>,
    isRunning: false,
  }),
  actions: {
    async runAnimations() {
      this.isRunning = true;

      const blockingAnimationPromises: Promise<void>[] = [];

      this.animations.forEach((animation) => {
        const runPromise = animation.run(
          this.ctxs as Record<string, CanvasRenderingContext2D>
        );

        if (animation.blocking) blockingAnimationPromises.push(runPromise);
      });

      await Promise.all(blockingAnimationPromises);

      this.animations = [];

      this.isRunning = false;
    },
    addAnimation(animation: GameAnimation) {
      this.animations.push(animation);
    },
    setContexts(ctxs: Record<string, CanvasRenderingContext2D>) {
      this.ctxs = ctxs;
    },
  },
});
