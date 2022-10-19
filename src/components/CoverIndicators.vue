<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Cover, Dir } from '@/utils/map';

interface IndicatorData {
  dir: Dir;
  value: Cover;
}

export default defineComponent({
  props: {
    covers: {
      type: Object as PropType<Record<Dir, Cover>>,
      required: true,
    },
  },
  computed: {
    indicators(): IndicatorData[] {
      return Object.entries(this.covers).map((entry: [string, Cover]) => {
        const dir = entry[0] as unknown as Dir;
        const value: Cover = entry[1];

        return { dir, value };
      });
    },
  },
});
</script>

<template>
  <div class="cover-indicators">
    <div class="indicators-container">
      <div
        v-for="indicatorData in indicators"
        :key="indicatorData.dir"
        class="indicator"
        :class="[indicatorData.dir, indicatorData.value]"
      />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.cover-indicators
  component-length = 6
  indicator-height = 3/4
  indicator-length = component-length * 5/8

  padding 0.25rem
  background-color #0d0380
  display inline-block
  border-radius 0.25rem
  border 1px solid #668

  .indicators-container
    width (component-length)rem
    height (component-length)rem
    position relative

    .indicator
      position absolute
      left ((component-length - indicator-length) / 2)rem
      width (indicator-length)rem
      border 1px solid #4c42bd
      height (indicator-height)rem
      background-color #231e57
      transform-origin center (component-length / 2)rem

      &.right
        transform rotate(90deg)
      &.down
        transform rotate(180deg)
      &.left
        transform rotate(-90deg)

      &::after
        content ''
        position absolute
        bottom 0
        left 0
        width 100%
        height 0%
        background-color transparent
        transition background-color 0.2s, height 0.2s

      &.half::after
        height 50%
        background-color #00aa00

      &.full::after
        height 100%
        background-color #00cc00
</style>
