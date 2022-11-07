<script lang="ts">
import { useGame } from '@/stores/game';
import {
  actionHandlers,
  ActionUiState,
  MetaUiState,
} from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';
import PlayerStatus from './PlayerStatus.vue';
import InventoryMenu from './InventoryMenu.vue';
import EntityDescription from './EntityDescription.vue';
import { useAnimations } from '@/stores/animations';
import PowersListMenu from './PowersListMenu.vue';
import GameMessages from './GameMessages.vue';
import UpgradeMenu from './UpgradeMenu.vue';

export default defineComponent({
  components: {
    GameTiles,
    PlayerStatus,
    InventoryMenu,
    EntityDescription,
    PowersListMenu,
    GameMessages,
    UpgradeMenu,
  },
  methods: {
    // Only will apply when this element is focused, i.e. when there's no menu being shown
    async onKey(e: KeyboardEvent) {
      if (this.onKeyIsRunning) return;
      if (useAnimations().isRunning) return;

      this.onKeyIsRunning = true;

      let keyStr = e.key;

      if (e.shiftKey) {
        keyStr += '+Shift';
      }

      try {
        actionHandlers[this.game.actionUiState]?.[keyStr]?.(this.game);
      } finally {
        await new Promise((res) => setTimeout(res, 0));
        this.onKeyIsRunning = false;
      }
    },
    closeMenu() {
      useGame().metaUiState = MetaUiState.Default;
      this.focus();
    },
    focus() {
      (this.$refs.mainGame as HTMLElement).focus();
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
    this.focus();
  },
  computed: {
    showInventoryMenu() {
      return this.game.metaUiState === MetaUiState.Inventory;
    },
    showPowersList() {
      return this.game.metaUiState === MetaUiState.PowersList;
    },
    showPerksList() {
      return this.game.metaUiState === MetaUiState.PerksList;
    },
    examinedEntity() {
      if (this.game.actionUiState !== ActionUiState.Examining) return null;
      if (!this.game.selectedTile) return null;

      const actor = this.game.creatureAt(this.game.selectedTile);

      const item = this.game.selectedTile.items[0]?.item;

      return actor ?? item ?? null;
    },
  },
});
</script>

<template>
  <div @keydown="onKey" tabindex="1" class="main-game" ref="mainGame">
    <div>
      <PlayerStatus />

      <div>Curr time: {{ game.currTime }}</div>

      <div>Curr level: {{ game.mapLevel }}</div>
    </div>

    <GameTiles />

    <EntityDescription v-if="examinedEntity" :entity="examinedEntity" />

    <GameMessages v-else />

    <InventoryMenu v-if="showInventoryMenu" class="menu" @close="closeMenu" />

    <PowersListMenu v-if="showPowersList" class="menu" @close="closeMenu" />

    <UpgradeMenu v-if="showPerksList" @close="closeMenu" />
  </div>
</template>

<style scoped lang="stylus">
.main-game
  display flex
  gap 2rem

  &:focus
    outline none
</style>
