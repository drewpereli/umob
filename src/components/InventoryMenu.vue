<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    const game = useGame();
    const menu = game.menu;

    menu.items = game.player.inventory.map((item) => {
      return { label: item.name, model: item };
    });

    return { menu };
  },
});
</script>

<template>
  <div class="inventory-menu">
    <div class="header-container">
      <h2>Inventory</h2>
    </div>

    <div class="items">
      <div
        v-for="(item, idx) in menu.items"
        :key="idx"
        class="item"
        :class="{ selected: idx === menu.selectedItemIdx }"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.inventory-menu
  background-color black
  width 50vw
  border 1px solid gray
  border-radius 4px

  .header-container
    padding 0.25rem 0.5rem
    border-bottom 1px solid gray

  .items
    .item
      padding 0.25rem 0.5rem
      margin-top 1rem

      &:first-child
        margin-top 0rem

      &.selected
        background-color yellow
        color black
</style>
