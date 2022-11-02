<script lang="ts">
import type { Power } from '@/powers/power';
import { TURN } from '@/stores/game';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    power: {
      type: Object as PropType<Power>,
      required: true,
    },
    hotKey: {
      type: String,
    },
  },
  computed: {
    coolDownPercentDone() {
      const coolDown = this.power.coolDown;
      const timeUntilUse = this.power.timeUntilUse;

      return Math.round((100 * (coolDown - timeUntilUse)) / coolDown);
    },
    turnsLeftOnCoolDown() {
      return Math.round(this.power.timeUntilUse / TURN);
    },
  },
});
</script>

<template>
  <div class="power-status">
    <span v-if="hotKey">{{ hotKey }}.</span>

    <div class="cool-down-bar-outer">
      <div
        class="cool-down-bar-inner"
        :style="{ width: `${coolDownPercentDone}%` }"
      />

      <span>{{ power.name }}</span>

      <span v-if="turnsLeftOnCoolDown">({{ turnsLeftOnCoolDown }})</span>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.power-status
  display flex
  align-items center

.cool-down-bar-outer
  overflow hidden
  border-radius 0.25rem
  border 1px solid gray
  background-color black
  color white
  position relative
  padding 0px 0.5rem
  flex-grow 1
  display flex
  align-items center
  justify-content space-between

  &:nth-child(2)
    margin-left 0.5rem

.cool-down-bar-inner
  background-color #1F51FF
  height 100%
  position absolute
  top 0
  left 0
</style>
