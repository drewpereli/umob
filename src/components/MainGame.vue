<script lang="ts">
import { useGame } from '@/stores/game';
import { actionHandlers, ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';

export default defineComponent({
  components: { GameTiles },
  methods: {
    async onKey({ key }: KeyboardEvent) {
      if (this.onKeyIsRunning) return;

      this.onKeyIsRunning = true;

      try {
        actionHandlers[this.game.actionUiState][key](this.game);
      } finally {
        await new Promise((res) => setTimeout(res, 0));
        this.onKeyIsRunning = false;
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
      uiState: ActionUiState.Default,
      onKeyIsRunning: false,
    };
  },
});
</script>

<template>
  <div @keydown="onKey" tabindex="1" class="main-game">
    <GameTiles />
  </div>
</template>

<style scoped>
.main-game:focus {
  outline: none;
}
</style>
