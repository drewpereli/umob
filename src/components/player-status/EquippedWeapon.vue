<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';
import WeaponStats from '../WeaponStats.vue';

export default defineComponent({
  setup() {
    return { game: useGame() };
  },
  computed: {
    weapon() {
      return this.game.player.equippedWeapon;
    },
  },
  components: { WeaponStats },
});
</script>

<template>
  <div class="equipped-weapon">
    <h4>Equipped Weapon</h4>
    <WeaponStats v-if="weapon" :weapon="weapon" />
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
