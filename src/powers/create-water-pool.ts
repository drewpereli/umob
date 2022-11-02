import { Water } from '@/entities/fluid';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { TargetedPower } from './targeted-power';

export class CreateWaterPool extends TargetedPower {
  static powerName = 'create water pool';
  static description = 'Creates a pool of water surrounding the targeted area';

  range = 5;
  coolDown = 10 * TURN;
  useTime = 2 * TURN;

  canTargetMovementBlocker = true;

  // Only allow creating it on floor tiles
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest || closest.terrain) {
      return;
    }

    return closest;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    const pool = new Water(tile, 7);

    this.game.addMapEntity(pool);
  }
}
