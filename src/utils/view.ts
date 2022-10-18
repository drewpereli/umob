import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import {
  drawTileMainCanvas,
  drawTileVisibilityCanvas,
  drawTileUiCanvas,
  CELL_LENGTH,
} from '@/utils/canvas';

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
        const actor = this.game.actorAt(tile);
        const visible = visibleTileIds.includes(tile.id);

        drawTileMainCanvas({
          ctx: this.ctxs.main,
          tile,
          actor,
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
        const tileHasActorAimedAt = tileIsAimedAt && !!this.game.actorAt(tile);
        const tileSelected = tile.id === this.game.selectedTile?.id;

        drawTileUiCanvas({
          ctx: this.ctxs.ui,
          position: { x, y },
          visible,
          tileIsAimedAt,
          tileHasActorAimedAt,
          tileSelected,
        });
      });
    });
  }

  setContexts(contexts: Record<string, CanvasRenderingContext2D>) {
    contexts.main.font = `${CELL_LENGTH * (28 / 32)}px Arial`;
    contexts.main.textBaseline = 'middle';
    contexts.main.textAlign = 'center';

    contexts.animationObjects.font = `${CELL_LENGTH * (28 / 32)}px Arial`;
    contexts.animationObjects.textBaseline = 'middle';
    contexts.animationObjects.textAlign = 'center';

    this.ctxs = contexts;
  }
}
