<script lang="ts">
import { defineComponent } from 'vue';
import HealthBar from './player-status/HealthBar.vue';
import EquippedWeapon from './player-status/EquippedWeapon.vue';
import { useGame } from '@/stores/game';
import CoverIndicators from './CoverIndicators.vue';

export default defineComponent({
  components: { HealthBar, EquippedWeapon, CoverIndicators },
  setup() {
    return { game: useGame() };
  },
});
</script>

<template>
  <div class="player-status">
    <HealthBar :actor="game.player" />
    <EquippedWeapon />
    <CoverIndicators :covers="game.player.covers" />
  </div>
</template>

<style scoped lang="stylus">
.player-status
  width 300px
  font-family monospace
  padding 1rem
  border-radius 4px
  border 1px solid gray
  & > *
    margin-top 0.5rem
    &:first-child
      margin-top 0
</style>
