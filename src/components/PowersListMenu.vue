<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu from './UiMenu.vue';

function computeMenuItems() {
  const game = useGame();
  const menu = game.menu;

  const items = game.player.powers.map((power, idx) => {
    const currHotkey = Object.keys(game.player.powerHotkeys).find(
      (hotKey) => game.player.powerHotkeys[hotKey] === power
    );

    return {
      label: `${power.name} ${currHotkey ? `(${currHotkey})` : ''}`,
      model: power,
      data: {
        hotKey: idx + 1,
      },
    };
  });

  menu.setItems(items);
}

export default defineComponent({
  setup() {
    const game = useGame();
    const menu = game.menu;

    computeMenuItems();

    return { menu, game };
  },
  components: { UiMenu },
  watch: {
    'game.player.powerHotkeys'() {
      computeMenuItems();
    },
  },
});
</script>

<template>
  <UiMenu
    title="Powers"
    :items="menu.items"
    :selectedItemIdx="menu.selectedItemIdx"
    :includeDescription="false"
  />
</template>
