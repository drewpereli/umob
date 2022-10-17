import type Actor from '@/entities/actor';
import bresenham from '@/utils/bresnham';
import { CELL_LENGTH, fillRect, fillText } from '@/utils/canvas';
import { polarity, slopeIntercept } from '@/utils/math';
import { random } from '@/utils/random';
import { defineStore } from 'pinia';
import { useCamera } from './camera';
import { distance } from './map';

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

  abstract run(ctxs: Record<string, CanvasRenderingContext2D>): Promise<void>;
}

export class DamageAnimation extends GameAnimation {
  constructor(actor: Actor) {
    super();

    this.actor = actor;
  }

  type = 'damage';
  actor;

  async run(ctxs: Record<string, CanvasRenderingContext2D>) {
    const ctx = ctxs.main;

    const actor = this.actor;

    const position = this.camera.viewCoordsForAbsCoords(actor);

    let isRed = false;

    for (let i = 0; i < 4; i++) {
      const color = isRed ? 'white' : 'red';
      isRed = !isRed;
      fillText(ctx, actor.char, position, color);
      await new Promise((res) => setTimeout(res, 20));
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
      (p, idx) => idx % 10 === 0
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
    const expandingRadii = Array.from({ length: 10 }).map(
      (_, idx) => ((idx + 1) / frameCount) * this.radius
    );

    const coordsToFillByFrame: Coords[][] = expandingRadii.map((radius) =>
      coordsInRadius(position, radius)
    );

    for (const coordsSet of coordsToFillByFrame) {
      ctx.fillStyle = 'rgba(255,165,0, 0.3)';

      coordsSet.forEach((coord) => {
        fillRect(ctx, coord, 'rgba(255,165,0, 0.3)');
      });

      await new Promise((res) => setTimeout(res, 30));
    }

    ctx.clearRect(
      (position.x - this.radius) * CELL_LENGTH,
      (position.y - this.radius) * CELL_LENGTH,
      2 * (this.radius + 1) * CELL_LENGTH,
      2 * (this.radius + 1) * CELL_LENGTH
    );
  }
}

export const useAnimations = defineStore('animations', {
  state: () => ({
    animations: [] as GameAnimation[],
    ctxs: null as null | Record<string, CanvasRenderingContext2D>,
  }),
  actions: {
    async runAnimations() {
      await Promise.all(
        this.animations.map((animation) =>
          animation.run(this.ctxs as Record<string, CanvasRenderingContext2D>)
        )
      );

      this.animations = [];
    },
    addAnimation(animation: GameAnimation) {
      this.animations.push(animation);
    },
    setContexts(ctxs: Record<string, CanvasRenderingContext2D>) {
      this.ctxs = ctxs;
    },
  },
});
