<script lang="ts">
import { defineComponent } from 'vue';
import HealthBar from './player-status/HealthBar.vue';
import EquippedWeapon from './player-status/EquippedWeapon.vue';

export default defineComponent({
  components: { HealthBar, EquippedWeapon },
});
</script>

<template>
  <div class="player-status">
    <HealthBar />
    <EquippedWeapon />
  </div>
</template>

<style scoped lang="stylus">
.player-status
  width 400px
  font-family monospace
  padding 1rem
  border-radius 4px
  border 1px solid gray
  div
    margin-top 0.5rem
    &:first-child
      margin-top 0
</style>
