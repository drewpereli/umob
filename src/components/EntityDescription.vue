<script lang="ts">
import type Creature from '@/entities/creature';
import { defineComponent, type PropType } from 'vue';
import HealthBar from './player-status/HealthBar.vue';

export default defineComponent({
  props: {
    entity: {
      type: Object as PropType<Creature>,
      required: true,
    },
  },
  components: { HealthBar },
});
</script>

<template>
  <div class="entity-description">
    <h2>{{ entity.name }}</h2>
    <HealthBar :actor="entity" />
  </div>
</template>

<style scoped lang="stylus">
.entity-description
  width 300px
  font-family monospace
  padding 1rem
  border-radius 4px
  border 1px solid gray
  div
    margin-top 0.5rem
    &:first-child
      margin-top 0
</style>
