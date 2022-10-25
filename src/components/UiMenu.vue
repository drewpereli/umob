<script lang="ts">
import type { MenuItem } from '@/stores/menu';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    items: {
      type: Object as PropType<MenuItem[]>,
      required: true,
    },
    selectedItemIdx: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
    },
    includeDescription: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    selectedItem() {
      return this.items[this.selectedItemIdx];
    },
  },
});
</script>

<template>
  <div class="ui-menu">
    <div v-if="title" class="header-container">
      <h2>{{ title }}</h2>
    </div>

    <div class="main-container">
      <div class="items">
        <div
          v-for="(item, idx) in items"
          :key="idx"
          class="item"
          :class="{ selected: idx === selectedItemIdx }"
        >
          {{ item.label }}
        </div>
      </div>

      <div v-if="includeDescription" class="description">
        <slot name="selected-item-description" :selectedItem="selectedItem">
          {{ selectedItem.description }}
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.ui-menu
  background-color black
  width 75vw
  min-height 50vh
  border 1px solid gray
  border-radius 4px

  &:focus
    outline none

.header-container
  padding 0.25rem 0.5rem
  border-bottom 1px solid gray

.main-container
  display flex

.items
  flex-basis 0
  flex-grow 2
  flex-shrink 0
  .item
    padding 0.25rem 0.5rem
    margin-top 1rem

    &:first-child
      margin-top 0rem

    &.selected
      background-color yellow
      color black

.description
  flex-basis 0
  flex-grow 1
  flex-shrink 0
  margin-left 1rem
  padding 1rem
  background-color #333
</style>
