<script lang="ts">
import type { Power } from '@/powers/power';
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import UiMenu, { type MenuItem } from './UiMenu.vue';

export default defineComponent({
  setup() {
    const game = useGame();
    return { player: game.player };
  },
  components: { UiMenu },
  computed: {
    // eslint-disable-next-line no-undef
    items(): MenuItem<Power>[] {
      return this.player.powers.map((power) => {
        let label = power.name;

        const existingHotKey = this.player.hotKeyForPower(power);

        if (existingHotKey) {
          label += ` (${existingHotKey})`;
        }

        return {
          label,
          model: power,
          description: power.description,
        };
      });
    },
  },
  methods: {
    anyKeyDown(key: string, item: MenuItem<Power>) {
      if (!/\d/.test(key)) return;

      const power = item.model;

      const existingHotKey = this.player.hotKeyForPower(power);

      if (existingHotKey) {
        delete this.player.powerHotkeys[existingHotKey];
      }

      this.player.powerHotkeys[key] = power;
    },
  },
});
</script>

<template>
  <UiMenu title="Powers" :items="items" @anyKeyDown="anyKeyDown" />
</template>
