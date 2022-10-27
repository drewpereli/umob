import { useGame } from '@/stores/game';
import { ToxicWaste } from '../fluid';
import { Barrel } from './barrel';

export class ToxicWasteBarrel extends Barrel {
  onDestroy() {
    const game = useGame();

    const tiles = game.map.tilesInRadius(this.tile, 3);

    tiles
      .filter((t) => !t.fluid)
      .filter((t) => !t.terrain?.blocksMovement)
      .forEach((t) => {
        const oil = new ToxicWaste(t, 1);
        game.addMapEntity(oil);
      });
  }

  color = '#00fc04';
}
