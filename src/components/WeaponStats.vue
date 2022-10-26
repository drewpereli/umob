<script lang="ts">
import { weaponIsGun } from '@/entities/weapons/gun';
import { DEFAULT_FLANKING_BONUS, Weapon } from '@/entities/weapons/weapon';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    weapon: {
      type: Object as PropType<Weapon>,
      required: true,
    },
  },
  data() {
    return {
      defaultFlankingBonus: DEFAULT_FLANKING_BONUS,
    };
  },
  computed: {
    range() {
      return weaponIsGun(this.weapon) && this.weapon.range;
    },
    spread() {
      return weaponIsGun(this.weapon) && this.weapon.spread;
    },
    penetration() {
      return weaponIsGun(this.weapon) && this.weapon.penetration;
    },
  },
});
</script>

<template>
  <div class="weapon-stats">
    <div>{{ weapon.name }}</div>
    <div>Damage: {{ weapon.damage }}</div>
    <div>Attack Time Multiplier: {{ weapon.attackTimeMultiplier }}</div>
    <div v-if="range">Range: {{ range }}</div>
    <div v-if="spread">Spread: {{ spread }}</div>
    <div v-if="weapon.knockBack">Knock-back: {{ weapon.knockBack }}</div>
    <div v-if="penetration">Penetration: {{ penetration }}</div>
    <div v-if="weapon.flankingBonus !== defaultFlankingBonus">
      Flanking bonus: {{ weapon.flankingBonus }}
    </div>
  </div>
</template>

<style scoped lang="stylus">
.weapon-stats
  font-family monospace
</style>
