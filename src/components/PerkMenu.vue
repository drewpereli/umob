<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';
import WeaponStats from './WeaponStats.vue';
import { itemIsWeapon, Weapon } from '@/entities/weapons/weapon';
import { perks, type Perk } from '@/perks';

type Item = MenuItem<Perk>;

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player };
  },
  components: { UiMenu },
  computed: {
    items(): Item[] {
      return perks.map((perk) => {
        return {
          label: perk.name,
          description: perk.description,
          model: perk,
          data: { disabled: this.player.hasPerk(perk) },
        };
      });
    },
  },
  methods: {
    enter(item: Item) {
      const perk = item.model;

      if (this.player.hasPerk(perk)) return;

      if (this.player.upgradePoints <= 0) return;

      this.player.applyPerk(perk);
    },
  },
});
</script>

<template>
  <UiMenu :items="items" @enter="enter">
    <template #title>
      <div class="title">
        <h2>Perks</h2>
        <h3>Current Points: {{ player.upgradePoints }}</h3>
      </div>
    </template>

    <template #item="slotProps: { item: Item }">
      <span class="item" :class="{ disabled: slotProps.item.data?.disabled }">{{
        slotProps.item.label
      }}</span>
    </template>
  </UiMenu>
</template>

<style scoped lang="stylus">
.title
  display flex
  align-items center

  h3
    margin-left 2rem

.item
  font-size 1.25rem
  .disabled
    opacity 0.5
</style>
