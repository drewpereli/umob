<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';
import WeaponStats from './WeaponStats.vue';
import type { Item } from '@/entities/items/item';
import { itemIsWeapon } from '@/entities/weapons/weapon';
import { itemIsUsable } from '@/entities/items/usable';
import { TargetedPower } from '@/powers/targeted-power';
import { itemIsWearable } from '@/wearables/wearable';
import { groupBy } from '@/utils/array';
import type { Player } from '@/entities/player';

function itemGroupHasEquippedItem(items: Item[], player: Player) {
  return items.some((item) => {
    return (
      item === player.equippedWeapon ||
      (itemIsWearable(item) && player.equippedWearablesArray.includes(item))
    );
  });
}

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player, itemIsWeapon };
  },
  components: { UiMenu, WeaponStats },
  computed: {
    items(): MenuItem<Item>[] {
      const inventory = this.player.inventory;

      const groupedInventory = groupBy(inventory, 'name');

      return groupedInventory.map((items) => {
        const isEquipped = itemGroupHasEquippedItem(items, this.player);

        const item = items[0];

        let label = isEquipped ? `* ${item.name}` : `${item.name}`;

        if (items.length > 1) {
          label += ` (${items.length})`;
        }

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
      } else if (itemIsWearable(item.model)) {
        if (this.player.equippedWearablesArray.includes(item.model)) {
          this.player.takeOff(item.model);
        } else {
          this.player.putOn(item.model);
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
