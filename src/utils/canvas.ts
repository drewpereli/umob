import { random } from '@/utils/random';
import bresenham from '@/utils/bresnham';
import type Actor from '@/entities/actor';
import {
  type GameAnimation,
  DamageAnimation,
  BulletAnimation,
  ExplosionAnimation,
} from '@/stores/animations';
import type { useCamera } from '@/stores/camera';
import { distance, type Tile } from '@/stores/map';
import { polarity, slopeIntercept } from './math';

const CELL_LENGTH = 32;

function fillRect(ctx: CanvasRenderingContext2D, pos: Coords, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(
    pos.x * CELL_LENGTH,
    pos.y * CELL_LENGTH,
    CELL_LENGTH,
    CELL_LENGTH
  );
}

function fillText(
  ctx: CanvasRenderingContext2D,
  char: string,
  pos: Coords,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillText(char, (pos.x + 0.5) * CELL_LENGTH, (pos.y + 0.5) * CELL_LENGTH);
}

export function drawTileMainCanvas({
  ctx,
  position,
  tile,
  actor,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  tile: Tile;
  actor?: Actor;
  visible: boolean;
}) {
  fillRect(ctx, position, 'black');

  const terrainLastSeen = tile.terrainLastSeenByPlayer;

  if (visible) {
    if (actor) {
      fillText(ctx, actor.char, position, actor.color);
    } else {
      fillText(ctx, tile.terrain.char, position, tile.terrain.color);
    }
  } else if (terrainLastSeen?.char) {
    fillText(ctx, terrainLastSeen.char, position, terrainLastSeen.color);
  }
}

export function drawTileVisibilityCanvas({
  ctx,
  position,
  tile,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  tile: Tile;
  visible: boolean;
}) {
  let color = 'black';

  if (visible) {
    color = 'transparent';
  } else if (tile.terrainLastSeenByPlayer) {
    color = 'rgba(0,0,0,0.6)';
  }

  fillRect(ctx, position, color);
}

export function drawTileUiCanvas({
  ctx,
  position,
  visible,
  tileHasActorAimedAt,
  tileSelected,
  tileIsAimedAt,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  visible: boolean;
  tileHasActorAimedAt: boolean;
  tileSelected: boolean;
  tileIsAimedAt: boolean;
}) {
  let color: string | null = null;

  if (tileHasActorAimedAt && visible) {
    color = 'rgba(136,0,0,0.5)';
  } else if (tileSelected) {
    color = 'rgba(136,136,0,0.75)';
  } else if (tileIsAimedAt) {
    color = 'rgba(85,85,0,0.75)';
  }

  if (!color) return;

  fillRect(ctx, position, color);
}

export async function animateTile({
  ctxs,
  animation,
  camera,
}: {
  ctxs: Record<string, CanvasRenderingContext2D>;
  animation: GameAnimation;
  camera: ReturnType<typeof useCamera>;
}) {
  if (animation instanceof DamageAnimation) {
    const ctx = ctxs.main;

    const actor = animation.actor;

    const position = camera.viewCoordsForAbsCoords(actor);

    let isRed = false;

    for (let i = 0; i < 4; i++) {
      const color = isRed ? 'white' : 'red';
      isRed = !isRed;
      fillText(ctx, actor.char, position, color);
      await new Promise((res) => setTimeout(res, 20));
    }
  } else if (animation instanceof BulletAnimation) {
    const ctx = ctxs.animationObjects;

    const from = camera.viewCoordsForAbsCoords(animation.from);

    const pxFrom = {
      x: from.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: from.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    const to = camera.viewCoordsForAbsCoords(animation.to);

    const pxToIfHit = {
      x: to.x * CELL_LENGTH + CELL_LENGTH / 2,
      y: to.y * CELL_LENGTH + CELL_LENGTH / 2,
    };

    // Add a little variation to where the bullet actually goes.
    // If the shot was a miss, add more variation
    let randomOffset: Coords;

    if (animation.hit) {
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

    if (animation.hit) {
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
  } else if (animation instanceof ExplosionAnimation) {
    const ctx = ctxs.animationObjects;

    const position = camera.viewCoordsForAbsCoords(animation.at);

    const frameCount = 10;
    const expandingRadii = Array.from({ length: 10 }).map(
      (_, idx) => ((idx + 1) / frameCount) * animation.radius
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
      (position.x - animation.radius) * CELL_LENGTH,
      (position.y - animation.radius) * CELL_LENGTH,
      2 * (animation.radius + 1) * CELL_LENGTH,
      2 * (animation.radius + 1) * CELL_LENGTH
    );
  }
}

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
