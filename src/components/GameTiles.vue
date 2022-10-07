<script lang="ts">
import { defineComponent } from 'vue';
import GameTile from './GameTile.vue';

const length = 20;

export default defineComponent({
  data() {
    return { length };
  },
  components: { GameTile },
});
</script>

<template>
  <div class="game-tiles">
    <template v-for="y in length" :key="y">
      <template v-for="x in length" :key="x">
        <GameTile :x="x" :y="y" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.game-tiles {
  display: grid;
  grid-template-columns: repeat(20, auto);
  grid-template-rows: repeat(20, auto);
}
</style>
