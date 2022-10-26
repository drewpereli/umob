<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';
import WeaponStats from './WeaponStats.vue';
import { itemIsWeapon, Weapon } from '@/entities/weapons/weapon';

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player };
  },
  components: { UiMenu, WeaponStats },
  computed: {
    items(): MenuItem<Weapon>[] {
      return this.player.inventory.filter(itemIsWeapon).map((weapon) => {
        const label =
          weapon === this.player.equippedWeapon
            ? `* ${weapon.name}`
            : `${weapon.name}`;

        return {
          label,
          model: weapon,
        };
      });
    },
  },
  methods: {
    enter(item: MenuItem<Weapon>) {
      this.player.equippedWeapon = item.model;
    },
    anyKeyDown(key: string, item: MenuItem<Weapon>) {
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
        selectedItem: MenuItem<Weapon>,
      }"
    >
      <WeaponStats :weapon="selectedItemSlotProps.selectedItem.model" />

      <div>
        {{ selectedItemSlotProps.selectedItem.model.description }}
      </div>
    </template>
  </UiMenu>
</template>
