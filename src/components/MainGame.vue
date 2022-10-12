<script lang="ts">
import { useGame } from '@/stores/game';
import { actionHandlers, ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';

export default defineComponent({
  components: { GameTiles },
  methods: {
    onKey({ key }: KeyboardEvent) {
      actionHandlers[this.game.actionUiState][key](this.game);
    },
  },
  setup() {
    const game = useGame();

    game.initialize();

    return { game };
  },
  data(): { uiState: ActionUiState } {
    return {
      uiState: ActionUiState.Default,
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
