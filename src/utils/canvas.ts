import { isFlammable } from '@/entities/flammable';
import { isFluid } from '@/entities/fluid';
import { Gas } from '@/entities/gas';
import type MapEntity from '@/entities/map-entity';
import { BlackHole } from '@/powers/create-black-hole';
import { FLOOR_TERRAIN_DATA, type TerrainData } from '@/stores/map';
import chroma, { scale } from 'chroma-js';
import { random } from './random';
import { isAsciiDrawable } from './types';

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
  fillText(ctx, terrain.char as string, position, terrain.color as string);
}

export function drawEntity(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  entity: MapEntity
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
  } else if (isAsciiDrawable(entity)) {
    fillText(ctx, entity.char, position, entity.color);
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
