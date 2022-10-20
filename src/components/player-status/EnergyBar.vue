<script lang="ts">
import type Creature from '@/entities/creature';
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
      const fraction = this.actor.energy / this.actor.maxEnergy;
      const percentage = fraction * 100;

      return {
        width: `${percentage}%`,
      };
    },
  },
});
</script>

<template>
  <div class="energy-bar">
    <h3>Energy</h3>
    <div class="energy-bar-outer">
      <div class="energy-bar-inner" :style="innerStyle" />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.energy-bar
  .energy-bar-outer
    height 1rem
    border 1px solid gray
    .energy-bar-inner
      background-color #13a2d1
      height 100%
</style>
