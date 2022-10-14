import { defineStore } from 'pinia';

export interface MenuItem {
  model: unknown;
  label: string;
}

export const useMenu = defineStore('menu', {
  state() {
    return {
      items: [] as MenuItem[],
      selectedItemIdx: 0,
    };
  },
  actions: {
    previousItem() {
      this.selectedItemIdx -= 1;

      if (this.selectedItemIdx < 0)
        this.selectedItemIdx = this.items.length - 1;
    },
    nextItem() {
      this.selectedItemIdx += 1;

      if (this.selectedItemIdx === this.items.length) this.selectedItemIdx = 0;
    },
  },
  getters: {
    selectedItem(state) {
      return state.items[state.selectedItemIdx];
    },
  },
});
