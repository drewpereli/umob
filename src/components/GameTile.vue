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
    actor() {
      return this.game.actorAt(this.tile);
    },
    char() {
      return this.actor?.char ?? this.tile.terrain.char;
    },
    color() {
      return this.actor?.color ?? this.tile.terrain.color;
    },
  },
});
</script>

<template>
  <div class="game-tile" :style="{ color: color }">
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
  font-size: 24px;
}
</style>
