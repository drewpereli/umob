<script lang="ts">
import { useGame } from '@/stores/game';
import { Tile } from '@/stores/map';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    tile: { type: Tile, required: true },
  },
  setup() {
    const game = useGame();

    return { game };
  },
  computed: {
    char() {
      const actor = this.game.actorAt(this.tile);

      return actor?.char ?? this.tile.terrain.char;
    },
  },
});
</script>

<template>
  <div class="game-tile">
    {{ char }}
  </div>
</template>

<style scoped>
.game-tile {
  width: 32px;
  height: 32px;
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
