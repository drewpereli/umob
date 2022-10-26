import { isCreature } from '@/entities/creatures/creature';
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import { FLOOR_TERRAIN_DATA, type Tile } from '@/stores/map';
import {
  CELL_LENGTH,
  fillText,
  drawTerrain,
  fillRect,
  drawEntityTile,
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
    const aimedTileIds = this.game.tilesAimedAt.map((t) => t.id);
    const damageablesAimedAt = this.game.damageablesAimedAt;

    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const isVisible = visibleTileIds.includes(tile.id);

        const isAimedAt = aimedTileIds.includes(tile.id);
        const hasDamageableAimedAt = damageablesAimedAt.some((d) =>
          coordsEqual(d, tile)
        );
        const selected = tile.id === this.game.selectedTile?.id;

        this.drawTile({
          tile,
          isVisible,
          position: { x, y },
          isAimedAt,
          hasDamageableAimedAt,
          selected,
        });
      });
    });

    if (debugOptions.showPlayerLastSeen) {
      const lastSeens = this.game.nonPlayerActors.flatMap((actor) => {
        if (!isCreature(actor)) return [];
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

  drawTile({
    tile,
    isVisible,
    position,
    isAimedAt,
    selected,
    hasDamageableAimedAt,
  }: {
    tile: Tile;
    isVisible: boolean;
    position: Coords;
    isAimedAt: boolean;
    selected: boolean;
    hasDamageableAimedAt: boolean;
  }) {
    if (!isVisible) {
      if (tile.terrainLastSeenByPlayer) {
        drawTerrain(this.ctxs.terrain, position, tile.terrainLastSeenByPlayer);
        fillRect(this.ctxs.visibility, position, 'rgba(0,0,0,0.5)');
      } else {
        fillRect(this.ctxs.visibility, position, 'black');
      }

      return;
    }

    if (!tile.terrain) {
      drawTerrain(this.ctxs.terrain, position, FLOOR_TERRAIN_DATA);
    }

    tile.entities.forEach((entity) => {
      const ctx = this.ctxs[entity.layer];
      drawEntityTile(ctx, position, entity, tile);
    });

    let color: string | null = null;

    if (hasDamageableAimedAt && isVisible) {
      color = 'rgba(136,0,0,0.5)';
    } else if (selected) {
      color = 'rgba(136,136,0,0.75)';
    } else if (isAimedAt) {
      color = 'rgba(85,85,0,0.75)';
    }

    if (!color) return;

    fillRect(this.ctxs.ui, position, color);
  }
}
