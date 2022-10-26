<script lang="ts">
import type Creature from '@/entities/creatures/creature';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    actor: {
      type: Object as PropType<Creature>,
      required: true,
    },
  },
  computed: {
    innerStyle() {
      const fraction = this.actor.health / this.actor.maxHealth;
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
