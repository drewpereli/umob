<script lang="ts">
import { useGame } from '@/stores/game';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    const game = useGame();
    return { game };
  },
  computed: {
    innerStyle() {
      const fraction = this.game.player.health / this.game.player.maxHealth;
      const percentage = fraction * 100;

      return {
        width: `${percentage}%`,
      };
    },
  },
});
</script>

<template>
  <div class="health-bar">
    <h3>Health</h3>
    <div class="health-bar-outer">
      <div class="health-bar-inner" :style="innerStyle" />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.health-bar
  .health-bar-outer
    height 1rem
    border 1px solid gray
    .health-bar-inner
      background-color red
      height 100%
</style>
