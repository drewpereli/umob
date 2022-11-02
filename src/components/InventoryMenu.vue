<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';
import WeaponStats from './WeaponStats.vue';
import type { Item } from '@/entities/items/item';
import { itemIsWeapon } from '@/entities/weapons/weapon';
import { itemIsUsable } from '@/entities/items/usable';
import { TargetedPower } from '@/powers/targeted-power';

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player, itemIsWeapon };
  },
  components: { UiMenu, WeaponStats },
  computed: {
    items(): MenuItem<Item>[] {
      return this.player.inventory.map((item) => {
        const label =
          item === this.player.equippedWeapon
            ? `* ${item.name}`
            : `${item.name}`;

        return {
          label,
          model: item,
        };
      });
    },
  },
  methods: {
    enter(item: MenuItem<Item>) {
      if (itemIsWeapon(item.model)) {
        this.player.equippedWeapon = item.model;
      } else if (itemIsUsable(item.model)) {
        const power = useGame().playerUseUsable(item.model);

        if (power instanceof TargetedPower) {
          this.$emit('close');
        }
      }
    },
    anyKeyDown(key: string, item: MenuItem<Item>) {
      if (key === 'd') {
        this.player.dropItem(item.model);
      }
    },
  },
});
</script>

<template>
  <UiMenu
    title="Inventory"
    :items="items"
    @enter="enter"
    @anyKeyDown="anyKeyDown"
  >
    <template
      #selected-item-description="selectedItemSlotProps: {
        selectedItem: MenuItem<Item>,
      }"
    >
      <WeaponStats
        v-if="itemIsWeapon(selectedItemSlotProps.selectedItem.model)"
        :weapon="selectedItemSlotProps.selectedItem.model"
      />

      <div>
        {{ selectedItemSlotProps.selectedItem.model.description }}
      </div>
    </template>
  </UiMenu>
</template>
