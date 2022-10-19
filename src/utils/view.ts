import { Enemy } from '@/entities/enemy';
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import {
  drawTileMainCanvas,
  drawTileVisibilityCanvas,
  drawTileUiCanvas,
  CELL_LENGTH,
  fillText,
} from '@/utils/canvas';
import { debugOptions } from './debug-options';
import { coordsEqual } from './map';

export class View {
  ctxs: Record<string, CanvasRenderingContext2D> = {};

  get game() {
    return useGame();
  }

  get camera() {
    return useCamera();
  }

  get canvasLength() {
    return CELL_LENGTH * (2 * this.camera.viewRadius + 1);
  }

  get tiles() {
    return this.camera.displayTiles;
  }

  draw() {
    Object.values(this.ctxs).forEach((ctx) =>
      ctx.clearRect(0, 0, this.canvasLength, this.canvasLength)
    );

    const visibleTileIds = this.game.visibleTiles.map((tile) => tile.id);

    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const entities = this.game.entitiesAt(tile);
        const visible = visibleTileIds.includes(tile.id);

        drawTileMainCanvas({
          ctx: this.ctxs.main,
          tile,
          entities,
          position: { x, y },
          visible: visibleTileIds.includes(tile.id),
        });

        drawTileVisibilityCanvas({
          ctx: this.ctxs.visibility,
          position: { x, y },
          visible,
          tile,
        });

        const aimedTileIds = this.game.tilesAimedAt.map((t) => t.id);
        const tileIsAimedAt = aimedTileIds.includes(tile.id);
        const tileHasDamageableAimedAt = this.game.damageablesAimedAt.some(
          (d) => coordsEqual(d, tile)
        );
        const tileSelected = tile.id === this.game.selectedTile?.id;

        drawTileUiCanvas({
          ctx: this.ctxs.ui,
          position: { x, y },
          visible,
          tileIsAimedAt,
          tileHasDamageableAimedAt,
          tileSelected,
        });
      });
    });

    if (debugOptions.showPlayerLastSeen) {
      const lastSeens = this.game.nonPlayerActors.flatMap((actor) => {
        if (!(actor instanceof Enemy)) return [];
        return actor.lastSawPlayerAt ?? [];
      });

      lastSeens.forEach((coords) => {
        const viewCoords = this.camera.viewCoordsForAbsCoords(coords);

        fillText(this.ctxs.ui, '@', viewCoords, 'red');
      });
    }
  }

  setContexts(contexts: Record<string, CanvasRenderingContext2D>) {
    Object.values(contexts).forEach((context) => {
      context.font = `${CELL_LENGTH * (28 / 32)}px Arial`;
      context.textBaseline = 'middle';
      context.textAlign = 'center';
    });

    this.ctxs = contexts;
  }
}
