<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';
import { perks, type Perk } from '@/perks';
import { Power } from '@/powers/power';

type Item = MenuItem<Perk> | MenuItem<Power>;

const MENU_TYPES = ['perks', 'powers'] as const;

type MenuType = typeof MENU_TYPES[number];

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player };
  },
  data() {
    return { menuType: 'perks' as MenuType, menuTypes: MENU_TYPES };
  },
  components: { UiMenu },
  computed: {
    items(): Item[] {
      if (this.menuType === 'perks') {
        return perks.map((perk) => {
          return {
            label: perk.name,
            description: perk.description,
            model: perk,
            data: { disabled: this.player.hasPerk(perk) },
          };
        });
      } else {
        return this.player.powers.map((power) => {
          let label = power.name;

          const existingHotKey = this.player.hotKeyForPower(power);

          if (existingHotKey) {
            label = `${existingHotKey}. ${label}`;
          }

          label += ` (Lvl. ${power.currentUpgradeLevel})`;

          return {
            label,
            model: power,
            data: { disabled: !power.canUpgrade },
          };
        });
      }
    },
  },
  methods: {
    enter(item: Item) {
      if (this.player.upgradePoints <= 0) return;

      if (item.model instanceof Power) {
        const power = item.model;

        if (!power.canUpgrade) return;

        power.upgrade();
      } else {
        const perk = item.model;

        if (this.player.hasPerk(perk)) return;

        this.player.applyPerk(perk);
      }

      this.player.upgradePoints--;
    },
    anyKeyDown(key: string) {
      if (key !== 'Tab') return;

      if (this.menuType === 'perks') {
        this.menuType = 'powers';
      } else {
        this.menuType = 'perks';
      }
    },
    isPowerItem(item?: Item): item is MenuItem<Power> {
      return !!item && item.model instanceof Power;
    },
  },
});
</script>

<template>
  <UiMenu :items="items" @enter="enter" @anyKeyDown="anyKeyDown">
    <template #title>
      <div class="title">
        <div class="tabs">
          <h2
            v-for="t in menuTypes"
            :key="t"
            :class="{ selected: t === menuType }"
          >
            {{ t }}
          </h2>
        </div>
        <h3>Current Points: {{ player.upgradePoints }}</h3>
      </div>
    </template>

    <template #item="slotProps: { item: Item }">
      <span class="item" :class="{ disabled: slotProps.item.data?.disabled }">{{
        slotProps.item.label
      }}</span>
    </template>

    <template
      #selected-item-description="{ selectedItem }: { selectedItem: Item }"
    >
      <div v-if="isPowerItem(selectedItem)" class="power-description">
        <div class="main-description">{{ selectedItem.model.description }}</div>
        <div
          v-for="(levelD, idx) in selectedItem.model.levelDescriptions"
          :key="idx"
          class="level-description"
        >
          <h4>Level {{ idx + 1 }}</h4>
          <div>{{ levelD }}</div>
        </div>
      </div>

      <div>
        {{ selectedItem.description }}
      </div>
    </template>
  </UiMenu>
</template>

<style scoped lang="stylus">
.title
  display flex
  align-items center
  justify-content space-between

  .tabs
    display flex
    align-items center
    h2
      margin-left 1rem
      &.selected
        color yellow

.item
  font-size 1.25rem
  .disabled
    opacity 0.5

.power-description
  .main-description, .level-description
    margin-bottom 1rem
  .level-description h4
    font-weight bold
</style>
