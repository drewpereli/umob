<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return { game: useGame() };
  },
  computed: {
    weapon() {
      return this.game.player.equippedWeapon;
    },
  },
});
</script>

<template>
  <div class="equipped-weapon">
    <h4>Equipped Weapon</h4>
    <div v-if="weapon" class="weapon">
      <div>{{ weapon.name }}</div>
      <div>Damage: {{ weapon.damage }}</div>
      <div>Range: {{ weapon.range }}</div>
      <div>Attack Time Multiplier: {{ weapon.attackTimeMultiplier }}</div>
      <div v-if="weapon.spread">Spread: {{ weapon.spread }}</div>
    </div>
    <div v-else>No weapon equipped</div>
  </div>
</template>

<style scoped lang="stylus">
.equipped-weapon
  font-family monospace
  padding 1rem
  border-radius 4px
  border 1px solid gray
</style>
