<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export interface MenuItem<T = unknown> {
  label: string;
  model: T;
  description?: string;
}

export default defineComponent({
  props: {
    items: {
      type: Object as PropType<MenuItem[]>,
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
  data() {
    return {
      selectedItemIdx: 0,
    };
  },
  computed: {
    selectedItem() {
      return this.items[this.selectedItemIdx];
    },
  },
  methods: {
    up() {
      this.selectedItemIdx -= 1;

      if (this.selectedItemIdx < 0)
        this.selectedItemIdx = this.items.length - 1;
    },
    down() {
      this.selectedItemIdx += 1;

      if (this.selectedItemIdx === this.items.length) this.selectedItemIdx = 0;
    },
    close() {
      this.$emit('close');
    },
    enter() {
      this.$emit('enter', this.selectedItem);
    },
    anyKeyDown(e: KeyboardEvent) {
      this.$emit('anyKeyDown', e.key, this.selectedItem);
    },
  },
  mounted() {
    (this.$refs.menu as HTMLDivElement).focus();
  },
  watch: {
    items() {
      if (this.selectedItemIdx > this.items.length - 1) {
        this.selectedItemIdx = this.items.length - 1;
      }
    },
  },
});
</script>

<template>
  <div
    class="ui-menu"
    @keydown.stop.up="up"
    @keydown.stop.down="down"
    @keydown.stop.escape="close"
    @keydown.stop.enter="enter"
    @keydown.stop="anyKeyDown"
    @keydown.stop.prevent.tab=""
    ref="menu"
    tabindex="1"
  >
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
  position absolute
  left: 50%;
  transform: translateX(-50%);
  top 1rem

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
