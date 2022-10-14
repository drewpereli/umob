<script lang="ts">
import type Actor from '@/entities/actor';
import {
  BulletAnimation,
  DamageAnimation,
  ExplosionAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useCamera } from '@/stores/camera';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { ActionUiState } from '@/utils/action-handlers';
import { random } from '@/utils/random';
import bresenham from '@/utils/bresnham';
import { defineComponent } from 'vue';

type Coords = { x: number; y: number };

function slopeIntercept(c1: Coords, c2: Coords): { m: number; b: number } {
  const m = (c2.y - c1.y) / (c2.x - c1.x);
  const b = c1.y - m * c1.x;

  return { m, b };
}

function polarity(from: number, to: number): number {
  return to > from ? 1 : -1;
}

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
      ctx.fillStyle = actor.color;
      ctx.fillText(actor.char, x + length / 2, y + length / 2);
    } else {
      ctx.fillStyle = tile.terrain.color;
      ctx.fillText(tile.terrain.char, x + length / 2, y + length / 2);
    }
  } else if (terrainLastSeen?.char) {
    ctx.fillStyle = terrainLastSeen.color;
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
    backgroundColor = 'rgba(0,0,0,0.6)';
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
  visible,
  tileHasActorAimedAt,
  tileSelected,
  tileIsAimedAt,
}: {
  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  visible: boolean;
  tileHasActorAimedAt: boolean;
  tileSelected: boolean;
  tileIsAimedAt: boolean;
}) {
  let backgroundColor: string | null = null;

  if (tileHasActorAimedAt && visible) {
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
  ctxs,
  animation,
  camera,
}: {
  ctxs: Record<string, CanvasRenderingContext2D>;
  animation: GameAnimation;
  camera: ReturnType<typeof useCamera>;
}) {
  if (animation instanceof DamageAnimation) {
    const ctx = ctxs.main;

    const actor = animation.actor;

    const position = camera.viewCoordsForAbsCoords(actor);

    const length = 32;
    const x = position.x * length;
    const y = position.y * length;
    let isRed = false;

    for (let i = 0; i < 4; i++) {
      const color = isRed ? 'white' : 'red';
      isRed = !isRed;
      ctx.fillStyle = color;
      ctx.fillText(actor.char, x + length / 2, y + length / 2);
      await new Promise((res) => setTimeout(res, 20));
    }
  } else if (animation instanceof BulletAnimation) {
    const ctx = ctxs.animationObjects;

    const length = 32;
    const from = camera.viewCoordsForAbsCoords(animation.from);

    const pxFrom = {
      x: from.x * length + length / 2,
      y: from.y * length + length / 2,
    };

    const to = camera.viewCoordsForAbsCoords(animation.to);

    const pxToIfHit = {
      x: to.x * length + length / 2,
      y: to.y * length + length / 2,
    };

    // Add a little variation to where the bullet actually goes.
    // If the shot was a miss, add more variation
    let randomOffset: Coords;

    if (animation.hit) {
      randomOffset = {
        x: random.int(-10, 10),
        y: random.int(-10, 10),
      };
    } else {
      randomOffset = {
        x: random.polarity() * random.int(10, 16),
        y: random.polarity() * random.int(10, 16),
      };
    }

    pxToIfHit.x += randomOffset.x;
    pxToIfHit.y += randomOffset.y;

    const { m, b } = slopeIntercept(pxFrom, pxToIfHit);

    // If the shot was a miss, calculate a pxTo that's further from the original, so the bullet goes past the target
    let pxTo;

    if (animation.hit) {
      pxTo = pxToIfHit;
    } else {
      // If the target is directly above/below the shooter
      if (m === Infinity) {
        const yPolarity = polarity(pxFrom.y, pxToIfHit.y);
        pxTo = {
          x: pxToIfHit.x,
          y: pxToIfHit.y + 1000 * yPolarity,
        };
      } else {
        const xPolarity = polarity(pxFrom.x, pxToIfHit.x);
        const newX = pxToIfHit.x + 1000 * xPolarity;
        pxTo = {
          x: newX,
          y: m * newX + b,
        };
      }
    }

    const bulletLength = 5;

    // Subtract half the bullet length from the pixel coordinates, so that the pixels are in the middle
    pxTo.x -= Math.round(bulletLength / 2);
    pxTo.y -= Math.round(bulletLength / 2);
    pxFrom.x -= Math.round(bulletLength / 2);
    pxFrom.y -= Math.round(bulletLength / 2);

    // Include every 10th pixel in the line
    const pixelsInLine = bresenham(pxFrom, pxTo).filter(
      (p, idx) => idx % 10 === 0
    );

    for (const px of pixelsInLine) {
      ctx.fillStyle = 'white';
      ctx.fillRect(px.x, px.y, bulletLength, bulletLength);
      await new Promise((res) => setTimeout(res, 5));
      ctx.clearRect(px.x, px.y, bulletLength, bulletLength);
    }
  } else if (animation instanceof ExplosionAnimation) {
    const position = camera.viewCoordsForAbsCoords(animation.at);

    const length = 32;
    const x = position.x * length + length / 2;
    const y = position.y * length + length / 2;
    const radius = animation.radius * length;

    const ctx = ctxs.animationObjects;

    const sizes = Array.from({ length: 5 }).map((_, idx) => (idx + 1) / 5);

    for (const size of sizes) {
      const currRadius = size * radius;

      ctx.beginPath();
      ctx.arc(x, y, currRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'orange';
      ctx.fill();

      await new Promise((res) => setTimeout(res, 20));
    }

    ctx.clearRect(x - radius, y - radius, 2 * radius, 2 * radius);
  }
}

export default defineComponent({
  data() {
    return {
      ctxs: {} as Record<string, CanvasRenderingContext2D>,
      // mainCtx: null as unknown as CanvasRenderingContext2D,
      // visibilityCtx: null as unknown as CanvasRenderingContext2D,
      // uiCtx: null as unknown as CanvasRenderingContext2D,
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
      Object.values(this.ctxs).forEach((ctx) =>
        ctx.clearRect(0, 0, this.canvasLength, this.canvasLength)
      );

      const visibleTileIds = this.game.visibleTiles.map((tile) => tile.id);

      this.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
          const actor = this.game.actorAt(tile);
          const visible = visibleTileIds.includes(tile.id);

          drawTileMainCanvas({
            ctx: this.ctxs.main,
            tile,
            actor,
            position: { x, y },
            visible: visibleTileIds.includes(tile.id),
          });

          drawTileVisibilityCanvas({
            ctx: this.ctxs.visibility,
            position: { x, y },
            visible,
            tile,
          });

          const aimedTileIds = this.game.tilesAimedAt.map((t) => t.id);
          const tileIsAimedAt = aimedTileIds.includes(tile.id);
          const tileHasActorAimedAt =
            tileIsAimedAt && !!this.game.actorAt(tile);
          const tileSelected = tile.id === this.game.selectedTile?.id;

          drawTileUiCanvas({
            ctx: this.ctxs.ui,
            position: { x, y },
            visible,
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
          ctxs: this.ctxs,
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
    const canvasContainer = this.$refs.gameTiles as HTMLElement;

    canvasContainer
      .querySelectorAll('canvas')
      .forEach((canvas: HTMLCanvasElement) => {
        const layer = canvas.dataset.layer as string;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.ctxs[layer] = ctx;
      });

    this.ctxs.main.font = '28px Arial';
    this.ctxs.main.textBaseline = 'middle';
    this.ctxs.main.textAlign = 'center';

    this.draw();
  },
});
</script>

<template>
  <div class="game-tiles" ref="gameTiles">
    <canvas data-layer="main" :width="canvasLength" :height="canvasLength" />

    <canvas
      data-layer="animationObjects"
      :width="canvasLength"
      :height="canvasLength"
    />

    <canvas
      data-layer="visibility"
      :width="canvasLength"
      :height="canvasLength"
    />

    <canvas data-layer="ui" :width="canvasLength" :height="canvasLength" />

    <div v-if="gameOver" class="game-over-container">
      <div class="message">You Died</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.game-tiles
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
