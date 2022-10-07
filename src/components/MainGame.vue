<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';

const length = 20;

export default defineComponent({
  components: { GameTiles },
  methods: {
    keyLeft() {
      this.game.move({ x: -1 });
    },
    keyRight() {
      this.game.move({ x: 1 });
    },
    keyUp() {
      this.game.move({ y: -1 });
    },
    keyDown() {
      this.game.move({ y: 1 });
    },
  },
  setup() {
    const game = useGame();

    return { game };
  },
});
</script>

<template>
  <div
    @keydown.left="keyLeft"
    @keydown.right="keyRight"
    @keydown.up="keyUp"
    @keydown.down="keyDown"
    tabindex="1"
    class="main-game"
  >
    <GameTiles />
  </div>
</template>

<style scoped>
.main-game:focus {
  outline: none;
}
</style>
