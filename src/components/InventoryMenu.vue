<script lang="ts">
import type Gun from '@/entities/gun';
import { useGame } from '@/stores/game';
import type { MenuItem } from '@/stores/menu';
import { defineComponent } from 'vue';
import UiMenu from './UiMenu.vue';
import WeaponStats from './WeaponStats.vue';

export default defineComponent({
  setup() {
    const game = useGame();
    const menu = game.menu;
    menu.items = game.player.inventory.map((item) => {
      return { label: item.name, model: item, description: item.description };
    });
    return { menu };
  },
  components: { UiMenu, WeaponStats },
});
</script>

<template>
  <UiMenu
    title="Inventory"
    :items="menu.items"
    :selectedItemIdx="menu.selectedItemIdx"
  >
    <template
      #selected-item-description="selectedItemSlotProps: {
        selectedItem: MenuItem<Gun>,
      }"
    >
      <WeaponStats :weapon="selectedItemSlotProps.selectedItem.model" />

      <div>
        {{ selectedItemSlotProps.selectedItem.model.description }}
      </div>
    </template>
  </UiMenu>
</template>
