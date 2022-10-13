<script lang="ts">
import { useCamera } from '@/stores/camera';
import { defineComponent } from 'vue';
import GameTile from './GameTile.vue';

export default defineComponent({
  components: { GameTile },
  setup() {
    const camera = useCamera();

    return { camera };
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
  </div>
</template>

<style scoped lang="stylus">
.game-tiles
  border 1px solid white
  .row
    display flex
</style>
