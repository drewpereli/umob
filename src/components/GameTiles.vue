<script lang="ts">
import { EntityLayer } from '@/entities/map-entity';
import { useAnimations } from '@/stores/animations';
import { useGame } from '@/stores/game';
import { ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    const game = useGame();
    const animations = useAnimations();

    return { game, animations };
  },
  computed: {
    canvasLength() {
      return this.game.view.canvasLength;
    },
    gameOver() {
      return this.game.actionUiState === ActionUiState.GameOver;
    },
    canvasNames() {
      return [
        ...Object.values(EntityLayer),
        'animationObjects',
        'visibility',
        'ui',
      ];
    },
  },
  mounted() {
    const canvasContainer = this.$refs.gameTiles as HTMLElement;

    const contexts: Record<string, CanvasRenderingContext2D> = {};

    canvasContainer
      .querySelectorAll('canvas')
      .forEach((canvas: HTMLCanvasElement) => {
        const layer = canvas.dataset.layer as string;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        contexts[layer] = ctx;
      });

    this.game.view.setContexts(contexts);
    this.animations.setContexts(contexts);

    this.game.view.draw();
  },
});
</script>

<template>
  <div
    class="game-tiles"
    ref="gameTiles"
    :style="{ width: `${canvasLength}px` }"
  >
    <canvas
      v-for="(name, idx) in canvasNames"
      :key="idx"
      :data-layer="name"
      :width="canvasLength"
      :height="canvasLength"
    />

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
    &:first-child
      background-color black

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
