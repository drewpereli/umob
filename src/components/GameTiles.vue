<script lang="ts">
import { useAnimations } from '@/stores/animations';
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import { ActionUiState } from '@/utils/action-handlers';
import {
  drawTileMainCanvas,
  drawTileVisibilityCanvas,
  drawTileUiCanvas,
  animateTile,
} from '@/utils/canvas';
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      ctxs: {} as Record<string, CanvasRenderingContext2D>,
    };
  },
  setup() {
    const camera = useCamera();
    const game = useGame();
    const animations = useAnimations();

    return { camera, game, animations };
  },
  computed: {
    tiles() {
      return this.camera.displayTiles;
    },
    style() {
      return {
        width: `${32 * (2 * this.camera.viewRadius + 1) + 2}px`,
      };
    },
    canvasLength() {
      return 32 * (2 * this.camera.viewRadius + 1);
    },
    gameOver() {
      return this.game.actionUiState === ActionUiState.GameOver;
    },
  },
  methods: {
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
          const tileHasActorAimedAt =
            tileIsAimedAt && !!this.game.actorAt(tile);
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
    },
    animate() {
      this.animations.animations.forEach((animation) => {
        animateTile({
          ctxs: this.ctxs,
          animation,
          camera: this.camera,
        });
      });
    },
  },
  watch: {
    tiles() {
      this.draw();
    },
    'game.visibleTiles'() {
      this.draw();
    },
    'animations.isRunning'() {
      this.animate();
    },
  },
  mounted() {
    const canvasContainer = this.$refs.gameTiles as HTMLElement;

    canvasContainer
      .querySelectorAll('canvas')
      .forEach((canvas: HTMLCanvasElement) => {
        const layer = canvas.dataset.layer as string;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.ctxs[layer] = ctx;
      });

    this.ctxs.main.font = '28px Arial';
    this.ctxs.main.textBaseline = 'middle';
    this.ctxs.main.textAlign = 'center';

    this.draw();
  },
});
</script>

<template>
  <div
    class="game-tiles"
    ref="gameTiles"
    :style="{ width: `${canvasLength}px` }"
  >
    <canvas data-layer="main" :width="canvasLength" :height="canvasLength" />

    <canvas
      data-layer="animationObjects"
      :width="canvasLength"
      :height="canvasLength"
    />

    <canvas
      data-layer="visibility"
      :width="canvasLength"
      :height="canvasLength"
    />

    <canvas data-layer="ui" :width="canvasLength" :height="canvasLength" />

    <div v-if="gameOver" class="game-over-container">
      <div class="message">You Died</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.game-tiles
  position: relative

  canvas
    position absolute
    top 0
    left 0

  .game-over-container
    position absolute
    top 0
    left 0
    width 100%
    height 100%
    display flex
    align-items center
    justify-content center

    .message
      display flex
      align-items center
      justify-content center
      background-color black
      padding 2rem 4rem
      border 1px solid gray
      font-size 3rem
      font-weight bold
      color red
</style>
