<script lang="ts">
import type { StatusEffect } from '@/status-effects/status-effect';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    statusEffect: {
      type: Object as PropType<StatusEffect>,
      required: true,
    },
  },
  computed: {
    isTemporary() {
      return isFinite(this.statusEffect.maxDuration);
    },
    completionPercentage() {
      return (
        100 *
        (this.statusEffect.currentDuration / this.statusEffect.maxDuration)
      );
    },
  },
});
</script>

<template>
  <div class="status-effect">
    <span class="label">{{ statusEffect.name }}</span>
    <div class="outer-bar" v-if="isTemporary">
      <div
        class="inner-bar"
        :style="{ width: `${100 - completionPercentage}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.status-effect
  display flex
  align-items center
  .outer-bar
    height 1rem
    border 1px solid #333
    border-radius 2px
    background-color black
    position relative
    flex-grow 1
    margin-left 0.5rem
  .inner-bar
    position absolute
    top 0
    left 0
    height 100%
    background-color #aaa
</style>
