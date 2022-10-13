<script lang="ts">
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import { ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTile from './GameTile.vue';

export default defineComponent({
  components: { GameTile },
  setup() {
    const camera = useCamera();
    const game = useGame();

    return { camera, game };
  },
  computed: {
    tiles() {
      return this.camera.displayTiles;
    },
    style() {
      return {
        width: `${32 * (2 * this.camera.viewRadius + 1)}px`,
      };
    },
    gameOver() {
      return this.game.actionUiState === ActionUiState.GameOver;
    },
  },
});
</script>

<template>
  <div class="game-tiles" :style="style">
    <template v-for="(tileRow, rowIdx) in tiles" :key="rowIdx">
      <div class="row">
        <template v-for="(tile, colIdx) in tileRow" :key="colIdx">
          <GameTile :tile="tile" />
        </template>
      </div>
    </template>

    <div v-if="gameOver" class="game-over-container">
      <div class="message">You Died</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.game-tiles
  border 1px solid white
  position: relative
  .row
    display flex

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
