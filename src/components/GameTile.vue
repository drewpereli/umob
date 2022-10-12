<script lang="ts">
import { useGame } from '@/stores/game';
import { Tile } from '@/stores/map';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    tile: { type: Tile, required: true },
  },
  setup() {
    const game = useGame();

    return { game };
  },
  computed: {
    actor() {
      return this.game.actorAt(this.tile);
    },
    visible() {
      const visibleTileIds = this.game.visibleTiles.map((tile) => tile.id);
      return visibleTileIds.includes(this.tile.id);
    },
    char() {
      if (this.visible) {
        return this.actor?.char ?? this.tile.terrain.char;
      }

      if (this.tile.terrainLastSeenByPlayer) {
        return this.tile.terrainLastSeenByPlayer.char;
      }

      return '';
    },
    mainLayerStyle() {
      if (!this.visible) return {};

      return { color: this.actor?.color ?? this.tile.terrain.color };
    },
    visibilityLayerStyle() {
      let backgroundColor = 'black';

      if (this.visible) {
        backgroundColor = 'transparent';
      } else if (this.tile.terrainLastSeenByPlayer) {
        backgroundColor = 'rgba(0,0,0,0.5)';
      }

      return { backgroundColor };
    },
    uiLayerStyle() {
      let backgroundColor = 'transparent';

      const aimedTileIds = this.game.tilesAimedAt.map((t) => t.id);

      if (this.tile.id === this.game.selectedTile?.id) {
        backgroundColor = 'rgba(136,136,0,0.75)';
      } else if (aimedTileIds.includes(this.tile.id)) {
        backgroundColor = 'rgba(85,85,0,0.75)';
      }

      return { backgroundColor };
    },
  },
});
</script>

<template>
  <div class="game-tile">
    <div class="main-layer" :style="mainLayerStyle">{{ char }}</div>
    <div :style="visibilityLayerStyle" />
    <div :style="uiLayerStyle" />
  </div>
</template>

<style scoped lang="stylus">
.game-tile
  length = 32px
  width length
  height length
  background-color black
  font-size 0.75 * length
  position relative

  & > div
    position absolute
    width 100%
    height 100%

  .main-layer {
    display flex
    align-items center
    justify-content center
  }
</style>
