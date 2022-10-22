import { Lava } from '@/entities/fluid';
import type MapEntity from '@/entities/map-entity';
import { BlackHole } from '@/powers/create-black-hole';
import { FLOOR_TERRAIN_DATA, type TerrainData, type Tile } from '@/stores/map';
import { scale } from 'chroma-js';
import { random } from './random';
import { isAsciiDrawable } from './types';

export const CELL_LENGTH = 28;

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

export function drawTileMainCanvas({
  ctx,
  position,
  tile,
  entities,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: Coords;
  tile: Tile;
  entities: MapEntity[];
  visible: boolean;
}) {
  fillRect(ctx, position, 'black');

  const terrainLastSeen = tile.terrainLastSeenByPlayer;

  if (visible) {
    drawTerrain(ctx, position, tile.terrain);

    entities.forEach((e) => drawEntity(ctx, position, e));
  } else if (terrainLastSeen) {
    drawTerrain(ctx, position, terrainLastSeen);
  }
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  terrain: TerrainData = FLOOR_TERRAIN_DATA
) {
  fillText(ctx, terrain.char as string, position, terrain.color as string);
}

function drawEntity(
  ctx: CanvasRenderingContext2D,
  position: Coords,
  entity: MapEntity
) {
  if (entity instanceof BlackHole) {
    const pxCoords = positionToPx(position, 'center');

    const radius = CELL_LENGTH / 2 - 2;

    ctx.fillStyle = '#37334d';
    ctx.beginPath();
    ctx.arc(pxCoords.x, pxCoords.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  } else if (entity instanceof Lava) {
    const pallette = scale(['#db1e14', '#ff8936']);

    // Create a 4 x 4 grid of different colors in the cell
    Array.from({ length: 4 }).forEach((_, y) => {
      const offsetY = y / 4;
      Array.from({ length: 4 }).forEach((_, x) => {
        const offsetX = x / 4;

        const color = pallette(random.float()).css();

        ctx.fillStyle = color;
        const xPx = (position.x + offsetX) * CELL_LENGTH;
        const yPx = (position.y + offsetY) * CELL_LENGTH;
        const length = CELL_LENGTH / 4;

        ctx.fillRect(xPx, yPx, length, length);
      });
    });
  } else if (isAsciiDrawable(entity)) {
    fillText(ctx, entity.char, position, entity.color);
  }
}

export function drawTileVisibilityCanvas({
  ctx,
  position,
  tile,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: Coords;
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
  tileIsAimedAt,
  tileSelected,
  tileHasDamageableAimedAt,
}: {
  ctx: CanvasRenderingContext2D;
  position: Coords;
  visible: boolean;
  tileIsAimedAt: boolean;
  tileSelected: boolean;
  tileHasDamageableAimedAt: boolean;
}) {
  let color: string | null = null;

  if (tileHasDamageableAimedAt && visible) {
    color = 'rgba(136,0,0,0.5)';
  } else if (tileSelected) {
    color = 'rgba(136,136,0,0.75)';
  } else if (tileIsAimedAt) {
    color = 'rgba(85,85,0,0.75)';
  }

  if (!color) return;

  fillRect(ctx, position, color);
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
