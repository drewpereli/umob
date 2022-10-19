<script lang="ts">
import type Gun from '@/entities/gun';
import { DEFAULT_FLANKING_BONUS } from '@/entities/gun';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    weapon: {
      type: Object as PropType<Gun>,
      required: true,
    },
  },
  data() {
    return {
      defaultFlankingBonus: DEFAULT_FLANKING_BONUS,
    };
  },
});
</script>

<template>
  <div class="weapon-stats">
    <div>{{ weapon.name }}</div>
    <div>Damage: {{ weapon.damage }}</div>
    <div>Range: {{ weapon.range }}</div>
    <div>Attack Time Multiplier: {{ weapon.attackTimeMultiplier }}</div>
    <div v-if="weapon.spread">Spread: {{ weapon.spread }}</div>
    <div v-if="weapon.knockBack">Knock-back: {{ weapon.knockBack }}</div>
    <div v-if="weapon.penetration">Penetration: {{ weapon.penetration }}</div>
    <div v-if="weapon.flankingBonus !== defaultFlankingBonus">
      Flanking bonus: {{ weapon.flankingBonus }}
    </div>
  </div>
</template>

<style scoped lang="stylus">
.weapon-stats
  font-family monospace
</style>
