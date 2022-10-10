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
  },
});
</script>

<template>
  <div class="game-tiles">
    <template v-for="(tileRow, rowIdx) in tiles" :key="rowIdx">
      <div class="row">
        <template v-for="(tile, colIdx) in tileRow" :key="colIdx">
          <GameTile :tile="tile" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.game-tiles > .row {
  display: flex;
}
</style>
