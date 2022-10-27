import { isDoor } from '@/entities/terrain';
import { isFlammable } from '@/entities/flammable';
import { isFluid } from '@/entities/fluid';
import { Gas } from '@/entities/gas';
import type MapEntity from '@/entities/map-entity';
import { FireTripWire } from '@/entities/traps/fire-tripwire';
import { Orientation } from '@/entities/traps/trap';
import { TripWire } from '@/entities/traps/tripwire';
import { BlackHole } from '@/powers/create-black-hole';
import { FLOOR_TERRAIN_DATA, Tile, type TerrainData } from '@/stores/map';
import chroma, { scale } from 'chroma-js';
import { Dir } from './map';
import { random } from './random';
import { isAsciiDrawable, type AsciiDrawable } from './types';

export const CELL_LENGTH = 28;

const burningPallette = scale(['orange', 'red']);

export function fillRect(
  ctx: CanvasRenderingContext2D,
  pos: Coords,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    pos.x * CELL_LENGTH,
    pos.y * CELL_LENGTH,
    CELL_LENGTH,
    CELL_LENGTH
  );
}

function fillRectPx(
  ctx: CanvasRenderingContext2D,
  startPosPx: Coords,
  endPosPx: Coords,
  color: string
) {
  const startX = Math.min(startPosPx.x, endPosPx.x);
  const startY = Math.min(startPosPx.y, endPosPx.y);
  const width = Math.abs(startPosPx.x - endPosPx.x);
  const height = Math.abs(startPosPx.y - endPosPx.y);

  ctx.fillStyle = color;
  ctx.fillRect(startX, startY, width, height);
}

export function clearRect(ctx: CanvasRenderingContext2D, pos: Coords) {
  ctx.clearRect(
    pos.x * CELL_LENGTH,
    pos.y * CELL_LENGTH,
    CELL_LENGTH,
    CELL_LENGTH
  );
}

export function fillText(
  ctx: CanvasRenderingContext2D,
  char: string,
  pos: Coords,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillText(char, (pos.x + 0.5) * CELL_LENGTH, (pos.y + 0.5) * CELL_LENGTH);
}

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  terrain: TerrainData = FLOOR_TERRAIN_DATA
) {
  drawAsciiDrawable(ctx, position, terrain);
}

function drawAsciiDrawable(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  drawable: AsciiDrawable
) {
  if (drawable.backgroundColor) {
    fillRect(ctx, position, drawable.backgroundColor);
  }

  const rotate = (drawable.rotateChar ?? 0) % 360;

  // console.log(rotate);
  if (rotate) {
    ctx.save();

    const center = positionToPx(position, 'center');

    ctx.translate(center.x, center.y);

    ctx.rotate((rotate * Math.PI) / 180);

    ctx.translate(-center.x, -center.y);
  }

  fillText(ctx, drawable.char, position, drawable.color);

  if (rotate) {
    ctx.restore();
  }
}

export function drawEntityTile(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  entity: MapEntity,
  tile: Tile
) {
  if (entity instanceof Gas) {
    fillRect(ctx, position, entity.color);
  } else if (isFluid(entity)) {
    const baseColor = entity.baseColor;

    const darker = chroma(baseColor).darken(0.3);
    const lighter = chroma(baseColor).brighten(0.3);

    const pallette = scale([darker, lighter]);

    const burning = isFlammable(entity) && entity.isBurning;

    // Create a 4 x 4 grid of different colors in the cell
    Array.from({ length: 4 }).forEach((_, y) => {
      const offsetY = y / 4;
      Array.from({ length: 4 }).forEach((_, x) => {
        const offsetX = x / 4;

        let chromaColor = pallette(random.float());

        if (burning) {
          const burningColor = burningPallette(random.float());
          chromaColor = chromaColor.mix(burningColor, 0.1);
        }

        ctx.fillStyle = chromaColor.hex();
        const xPx = (position.x + offsetX) * CELL_LENGTH;
        const yPx = (position.y + offsetY) * CELL_LENGTH;
        const length = CELL_LENGTH / 4;

        ctx.fillRect(xPx, yPx, length, length);
      });
    });
  } else if (entity instanceof BlackHole) {
    const pxCoords = positionToPx(position, 'center');

    const radius = CELL_LENGTH / 2 - 2;

    ctx.fillStyle = '#37334d';
    ctx.beginPath();
    ctx.arc(pxCoords.x, pxCoords.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  } else if (entity instanceof TripWire) {
    const color = entity instanceof FireTripWire ? 'red' : 'white';

    const centerPx = positionToPx(position, 'center');

    if (entity.anchorTiles.has(tile)) {
      fillCirclePxPosition(ctx, centerPx, 4, color);

      const dir = entity.anchorTiles.get(tile);

      const rectStartPx = { ...centerPx };
      const rectEndPx = { ...centerPx };

      if (dir === Dir.Up) {
        rectEndPx.y += CELL_LENGTH / 2;
        rectEndPx.x += 1;
        rectStartPx.x -= 1;
      } else if (dir === Dir.Down) {
        rectEndPx.y -= CELL_LENGTH / 2;
        rectEndPx.x += 1;
        rectStartPx.x -= 1;
      } else if (dir === Dir.Left) {
        rectEndPx.x += CELL_LENGTH / 2;
        rectEndPx.y += 1;
        rectStartPx.y -= 1;
      } else if (dir === Dir.Right) {
        rectEndPx.x -= CELL_LENGTH / 2;
        rectEndPx.y += 1;
        rectStartPx.y -= 1;
      }

      fillRectPx(ctx, rectStartPx, rectEndPx, color);
    } else {
      if (entity.orientation === Orientation.Horizontal) {
        const rectStartPx = {
          y: centerPx.y + 1,
          x: centerPx.x - CELL_LENGTH / 2,
        };

        const rectEndPx = {
          y: centerPx.y - 1,
          x: centerPx.x + CELL_LENGTH / 2,
        };

        fillRectPx(ctx, rectStartPx, rectEndPx, color);
      } else {
        const rectStartPx = {
          x: centerPx.x + 1,
          y: centerPx.y - CELL_LENGTH / 2,
        };

        const rectEndPx = {
          x: centerPx.x - 1,
          y: centerPx.y + CELL_LENGTH / 2,
        };

        fillRectPx(ctx, rectStartPx, rectEndPx, color);
      }
    }
  } else if (isAsciiDrawable(entity)) {
    drawAsciiDrawable(ctx, position, entity);
  }
}

function positionToPx(coords: Coords, positionInCell?: 'center'): Coords {
  return {
    x:
      coords.x * CELL_LENGTH +
      (positionInCell === 'center' ? CELL_LENGTH / 2 : 0),
    y:
      coords.y * CELL_LENGTH +
      (positionInCell === 'center' ? CELL_LENGTH / 2 : 0),
  };
}

function fillCirclePxPosition(
  ctx: CanvasRenderingContext2D,
  pxCoords: Coords,
  pxRadius: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pxCoords.x, pxCoords.y, pxRadius, 0, 2 * Math.PI);
  ctx.fill();
}
