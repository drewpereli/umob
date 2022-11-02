<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type Gun from '@/entities/weapons/gun';

export default defineComponent({
  props: {
    gun: {
      type: Object as PropType<Gun>,
      required: true,
    },
  },
  computed: {
    clipSize() {
      return this.gun.clipSize;
    },
    amoLoaded() {
      return this.gun.amoLoaded;
    },
  },
});
</script>

<template>
  <div v-if="isFinite(clipSize)" class="weapon-clip-status">
    <span
      v-for="n in clipSize"
      :key="n"
      class="amo-slot"
      :class="{ loaded: n <= amoLoaded }"
    />
  </div>
</template>

<style scoped lang="stylus">
.weapon-clip-status
  display flex
  flex-wrap wrap
  gap 0.25rem

.amo-slot
  width 1rem
  height 0.5rem
  background-color #000
  border 1px solid #888
  border-radius 2px

  &.loaded
    background-color green
</style>
