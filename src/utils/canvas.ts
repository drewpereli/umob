import type Actor from '@/entities/actor';
import type { TerrainData, Tile } from '@/stores/map';
import { scale } from 'chroma-js';
import { random } from './random';

export const CELL_LENGTH = 32;

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
    drawTerrain(ctx, tile.terrain, position);

    if (actor) {
      fillText(ctx, actor.char, position, actor.color);
    }
  } else if (terrainLastSeen) {
    drawTerrain(ctx, terrainLastSeen, position);
  }
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainData,
  position: Coords
) {
  if (terrain.type === 'lava') {
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
  } else {
    fillText(ctx, terrain.char, position, terrain.color);
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
