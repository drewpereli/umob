import { useGame } from '@/stores/game';
import { Water } from '../fluid';
import { Barrel } from './barrel';

export class WaterBarrel extends Barrel {
  onDestroy() {
    const game = useGame();

    const tiles = game.map.tilesInRadius(this.tile, 3);

    tiles
      .filter((t) => !t.fluid)
      .filter((t) => !t.terrain?.blocksMovement)
      .forEach((t) => {
        const water = new Water(t, 1);
        game.addMapEntity(water);
      });
  }

  color = '#4287f5';
}
