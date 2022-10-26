<script lang="ts">
import { RadLevel, radLevelFromRads } from '@/utils/radiation';
import chroma from 'chroma-js';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    rads: {
      type: Number,
      required: true,
    },
  },
  computed: {
    color() {
      const radColor = '#32CD32';
      const radLevels = Object.values(RadLevel);
      const radLevelIdx = radLevels.indexOf(this.radLevel);
      const ratio = radLevelIdx / (radLevels.length - 1);

      return chroma.mix('gray', radColor, ratio).hex();
    },
    radLevel() {
      return radLevelFromRads(this.rads);
    },
  },
});
</script>

<template>
  <div :style="{ color: color }">
    Radiation: {{ Math.round(rads) }} ({{ radLevel }})
  </div>
</template>
