<script lang="ts">
import type Actor from '@/entities/actor';
import {
  DamageAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { ActionUiState } from '@/utils/action-handlers';
import { defineComponent } from 'vue';

function drawTileMainCanvas({
  ctx,
  position,
  tile,
  actor,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  tile: Tile;
  actor?: Actor;
  visible: boolean;
}) {
  const length = 32;
  const x = position.x * length;
  const y = position.y * length;

  ctx.fillStyle = 'black';
  ctx.fillRect(x, y, length, length);

  const terrainLastSeen = tile.terrainLastSeenByPlayer;

  if (visible) {
    if (actor) {
      ctx.fillStyle = 'white';
      ctx.fillText(actor.char, x + length / 2, y + length / 2);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillText(tile.terrain.char, x + length / 2, y + length / 2);
    }
  } else if (terrainLastSeen?.char) {
    ctx.fillStyle = 'white';
    ctx.fillText(terrainLastSeen.char, x + length / 2, y + length / 2);
  }
}

function drawTileVisibilityCanvas({
  ctx,
  position,
  tile,
  visible,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  tile: Tile;
  visible: boolean;
}) {
  let backgroundColor = 'black';

  if (visible) {
    backgroundColor = 'transparent';
  } else if (tile.terrainLastSeenByPlayer) {
    backgroundColor = 'rgba(0,0,0,0.5)';
  }

  ctx.fillStyle = backgroundColor;

  const length = 32;
  const x = position.x * length;
  const y = position.y * length;

  ctx.fillRect(x, y, length, length);
}

function drawTileUiCanvas({
  ctx,
  position,
  tileHasActorAimedAt,
  tileSelected,
  tileIsAimedAt,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  tileHasActorAimedAt: boolean;
  tileSelected: boolean;
  tileIsAimedAt: boolean;
}) {
  let backgroundColor: string | null = null;

  if (tileHasActorAimedAt) {
    backgroundColor = 'rgba(136,0,0,0.5)';
  } else if (tileSelected) {
    backgroundColor = 'rgba(136,136,0,0.75)';
  } else if (tileIsAimedAt) {
    backgroundColor = 'rgba(85,85,0,0.75)';
  }

  if (!backgroundColor) return;

  ctx.fillStyle = backgroundColor;

  const length = 32;
  const x = position.x * length;
  const y = position.y * length;

  ctx.fillRect(x, y, length, length);
}

async function animateTile({
  ctx,
  animation,
  camera,
}: {
  ctx: CanvasRenderingContext2D;
  animation: GameAnimation;
  camera: ReturnType<typeof useCamera>;
}) {
  if (!(animation instanceof DamageAnimation)) return;

  const actor = animation.actor;

  const position = camera.viewCoordsForAbsCoords(actor);

  const length = 32;
  const x = position.x * length;
  const y = position.y * length;
  let isRed = false;

  for (let i = 0; i < 6; i++) {
    const color = isRed ? 'white' : 'red';
    isRed = !isRed;
    ctx.fillStyle = color;
    ctx.fillText(actor.char, x + length / 2, y + length / 2);
    await new Promise((res) => setTimeout(res, 50));
  }
}

export default defineComponent({
  data() {
    return {
      mainCtx: null as unknown as CanvasRenderingContext2D,
      visibilityCtx: null as unknown as CanvasRenderingContext2D,
      uiCtx: null as unknown as CanvasRenderingContext2D,
    };
  },
  setup() {
    const camera = useCamera();
    const game = useGame();
    const animations = useAnimations();

    return { camera, game, animations };
  },
  computed: {
    tiles() {
      return this.camera.displayTiles;
    },
    style() {
      return {
        width: `${32 * (2 * this.camera.viewRadius + 1) + 2}px`,
      };
    },
    canvasLength() {
      return 32 * (2 * this.camera.viewRadius + 1);
    },
    gameOver() {
      return this.game.actionUiState === ActionUiState.GameOver;
    },
  },
  methods: {
    draw() {
      this.mainCtx.clearRect(0, 0, this.canvasLength, this.canvasLength);
      this.visibilityCtx.clearRect(0, 0, this.canvasLength, this.canvasLength);
      this.uiCtx.clearRect(0, 0, this.canvasLength, this.canvasLength);

      const visibleTileIds = this.game.visibleTiles.map((tile) => tile.id);

      this.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
          const actor = this.game.actorAt(tile);

          drawTileMainCanvas({
            ctx: this.mainCtx,
            tile,
            actor,
            position: { x, y },
            visible: visibleTileIds.includes(tile.id),
          });

          drawTileVisibilityCanvas({
            ctx: this.visibilityCtx,
            position: { x, y },
            visible: visibleTileIds.includes(tile.id),
            tile,
          });

          const aimedTileIds = this.game.tilesAimedAt.map((t) => t.id);
          const tileIsAimedAt = aimedTileIds.includes(tile.id);
          const tileHasActorAimedAt =
            tileIsAimedAt && !!this.game.actorAt(tile);
          const tileSelected = tile.id === this.game.selectedTile?.id;

          drawTileUiCanvas({
            ctx: this.uiCtx,
            position: { x, y },
            tileIsAimedAt,
            tileHasActorAimedAt,
            tileSelected,
          });
        });
      });
    },
    animate() {
      this.animations.animations.forEach((animation) => {
        animateTile({
          ctx: this.mainCtx,
          animation,
          camera: this.camera,
        });
      });
    },
  },
  watch: {
    tiles() {
      this.draw();
    },
    'game.visibleTiles'() {
      this.draw();
    },
    'animations.isRunning'() {
      this.animate();
    },
  },
  mounted() {
    const mainCanvas = this.$refs.mainCanvas as HTMLCanvasElement;
    const mainCtx = mainCanvas.getContext('2d') as CanvasRenderingContext2D;

    const visibilityCanvas = this.$refs.visibilityCanvas as HTMLCanvasElement;
    const visibilityCtx = visibilityCanvas.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    const uiCanvas = this.$refs.uiCanvas as HTMLCanvasElement;
    const uiCtx = uiCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.mainCtx = mainCtx;
    this.visibilityCtx = visibilityCtx;
    this.uiCtx = uiCtx;

    mainCtx.font = '32px serif';
    mainCtx.textBaseline = 'middle';
    mainCtx.textAlign = 'center';

    this.draw();
  },
});
</script>

<template>
  <div class="game-tiles">
    <canvas ref="mainCanvas" :width="canvasLength" :height="canvasLength" />

    <canvas
      ref="visibilityCanvas"
      :width="canvasLength"
      :height="canvasLength"
    />

    <canvas ref="uiCanvas" :width="canvasLength" :height="canvasLength" />

    <div v-if="gameOver" class="game-over-container">
      <div class="message">You Died</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.game-tiles
  border 1px solid white
  position: relative

  canvas
    position absolute
    top 0
    left 0

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
