import type Actor from '@/entities/actor';
import type { Tile } from '@/stores/map';

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
