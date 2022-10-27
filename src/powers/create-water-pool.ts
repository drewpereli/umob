import { Water } from '@/entities/fluid';
import { TURN } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { TargetedPower } from './targeted-power';

export class CreateWaterPool extends TargetedPower {
  readonly name = 'create water pool';
  range = 5;
  energyCost = 10;
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
