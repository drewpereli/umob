import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { TargetedPower } from './targeted-power';

export class Push extends TargetedPower {
  static powerName = 'push';
  static description = 'Push the targeted creatures away from you';
  canTargetMovementBlocker = true;
  coolDown = 5 * TURN;
  useTime = TURN;
  range = 7;

  get canActivate() {
    const closest = this.closestValidToSelected() as Tile;
    return super.canActivate && closest.creatures.length > 0;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    tile.creatures.forEach((creature) => {
      creature.receiveKnockBack(0, 7, this.owner);
    });
  }
}
