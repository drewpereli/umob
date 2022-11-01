import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { TargetedPower } from './targeted-power';

export class Push extends TargetedPower {
  name = 'push';
  canTargetMovementBlocker = true;
  energyCost = 20;
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
