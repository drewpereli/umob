import { useGame } from '@/stores/game';
import { Oil } from '../fluid';
import { Barrel } from './barrel';

export class OilBarrel extends Barrel {
  onDestroy() {
    const game = useGame();

    const tiles = game.map.tilesInRadius(this.tile, 3);

    tiles
      .filter((t) => !t.fluid)
      .filter((t) => !t.terrain?.blocksMovement)
      .forEach((t) => {
        const oil = new Oil(t, 1);
        oil.startBurning();
        game.addMapEntity(oil);
      });
  }

  color = '#59475d';
}
