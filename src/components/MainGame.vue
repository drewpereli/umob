<script lang="ts">
import { useGame } from '@/stores/game';
import { Dir } from '@/stores/map';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';

export default defineComponent({
  components: { GameTiles },
  methods: {
    keyLeft() {
      this.game.movePlayer({ x: -1 });
    },
    keyRight() {
      if (this.uiState === 'aiming') {
        if (!this.game.selectedTile) {
          return;
        }

        const target = this.game.map.adjacentTile(
          this.game.selectedTile,
          Dir.Right
        );

        if (!target) {
          return;
        }

        this.game.selectedTile = target;
      } else {
        this.game.movePlayer({ x: 1 });
      }
    },
    keyUp() {
      this.game.movePlayer({ y: -1 });
    },
    keyDown() {
      this.game.movePlayer({ y: 1 });
    },
    onKey({ key }: KeyboardEvent) {
      if (key === 'a') {
        this.uiState = 'aiming';
        const playerTile = this.game.map.tileAt(this.game.player);

        const target = this.game.map.adjacentTile(playerTile, Dir.Up);

        if (!target) {
          return;
        }

        this.game.selectedTile = target;
      }
    },
  },
  setup() {
    const game = useGame();

    game.initialize();

    return { game };
  },
  data() {
    return {
      uiState: 'default',
    };
  },
});
</script>

<template>
  <div
    @keydown.left="keyLeft"
    @keydown.right="keyRight"
    @keydown.up="keyUp"
    @keydown.down="keyDown"
    @keydown="onKey"
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
