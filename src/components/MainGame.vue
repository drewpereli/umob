<script lang="ts">
import { useGame } from '@/stores/game';
import { actionHandlers, ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';
import PlayerStatus from './PlayerStatus.vue';
import InventoryMenu from './InventoryMenu.vue';

export default defineComponent({
  components: { GameTiles, PlayerStatus, InventoryMenu },
  methods: {
    async onKey({ key }: KeyboardEvent) {
      if (this.onKeyIsRunning) return;

      this.onKeyIsRunning = true;

      try {
        actionHandlers[this.game.actionUiState]?.[key]?.(this.game);
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
      onKeyIsRunning: false,
    };
  },
  mounted() {
    (this.$refs.mainGame as HTMLElement).focus();
  },
  computed: {
    showInventoryMenu() {
      return this.game.actionUiState === ActionUiState.Inventory;
    },
  },
});
</script>

<template>
  <div @keydown="onKey" tabindex="1" class="main-game" ref="mainGame">
    <PlayerStatus />

    <GameTiles />

    <InventoryMenu v-if="showInventoryMenu" class="inventory-menu" />
  </div>
</template>

<style scoped lang="stylus">
.main-game
  display flex
  gap 2rem

  &:focus
    outline none

  .inventory-menu
    position absolute
    left: 50%;
    transform: translateX(-50%);
    top 1rem
</style>
