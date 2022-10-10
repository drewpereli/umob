<script lang="ts">
import { useMap } from '@/stores/map';
import { defineComponent } from 'vue';
import GameTile from './GameTile.vue';

export default defineComponent({
  components: { GameTile },
  setup() {
    const map = useMap();

    return { tiles: map.tiles };
  },
});
</script>

<template>
  <div class="game-tiles">
    <template v-for="(tile, idx) in tiles" :key="idx">
      <GameTile :tile="tile" />
    </template>
  </div>
</template>

<style scoped>
.game-tiles {
  display: grid;
  grid-template-columns: repeat(20, auto);
  grid-template-rows: repeat(20, auto);
  width: 400px;
}
</style>
