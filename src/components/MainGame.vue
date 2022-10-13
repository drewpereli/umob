<script lang="ts">
import { useGame } from '@/stores/game';
import { actionHandlers, ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';
import GameTiles from './GameTiles.vue';

export default defineComponent({
  components: { GameTiles },
  methods: {
    async onKey({ key }: KeyboardEvent) {
      if (this.onKeyIsRunning) return;

      this.onKeyIsRunning = true;

      try {
        actionHandlers[this.game.actionUiState]?.[key]?.(this.game);
      } finally {
        await new Promise((res) => setTimeout(res, 0));
        this.onKeyIsRunning = false;
      }
    },
  },
  setup() {
    const game = useGame();

    game.initialize();

    return { game };
  },
  data() {
    return {
      onKeyIsRunning: false,
    };
  },
  mounted() {
    (this.$refs.mainGame as HTMLElement).focus();
  },
  computed: {
    gameOver() {
      return this.game.actionUiState === ActionUiState.GameOver;
    },
  },
});
</script>

<template>
  <div @keydown="onKey" tabindex="1" class="main-game" ref="mainGame">
    <GameTiles />

    <div v-if="gameOver" class="game-over-container">
      <div class="message">You Died</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.main-game
  display relative

  &:focus
    outline none

  .game-over-container
    position absolute
    top 0
    left 0
    width 100%
    height 100%
    display flex
    align-items center
    justify-content center

    .message
      display flex
      align-items center
      justify-content center
      background-color black
      padding 2rem 4rem
      border 1px solid gray
      font-size 3rem
      font-weight bold
      color red
</style>
