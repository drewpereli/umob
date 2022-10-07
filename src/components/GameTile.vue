<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  setup() {
    const game = useGame();

    return { game };
  },
  computed: {
    char() {
      const actor = this.game.allActors.find(
        (actor) => actor.x === this.x && actor.y === this.y
      );

      return actor?.char || '';
    },
  },
});
</script>

<template>
  <div class="game-tile">{{ char }}</div>
</template>

<style scoped>
.game-tile {
  width: 32px;
  height: 32px;
  border: 1px solid gray;
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
