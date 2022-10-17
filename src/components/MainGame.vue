<script lang="ts">
import { useGame } from '@/stores/game';
import { actionHandlers, ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';
import PlayerStatus from './PlayerStatus.vue';
import InventoryMenu from './InventoryMenu.vue';
import EntityDescription from './EntityDescription.vue';
import { useAnimations } from '@/stores/animations';

export default defineComponent({
  components: { GameTiles, PlayerStatus, InventoryMenu, EntityDescription },
  methods: {
    async onKey({ key }: KeyboardEvent) {
      if (this.onKeyIsRunning) return;
      if (useAnimations().isRunning) return;

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
    examinedEntity() {
      if (this.game.actionUiState !== ActionUiState.Examining) return null;
      if (!this.game.selectedTile) return null;

      const actor = this.game.actorAt(this.game.selectedTile);

      if (!actor) return null;

      return actor;
    },
  },
});
</script>

<template>
  <div @keydown="onKey" tabindex="1" class="main-game" ref="mainGame">
    <PlayerStatus />

    <GameTiles />

    <EntityDescription v-if="examinedEntity" :entity="examinedEntity" />

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
