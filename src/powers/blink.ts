import { TargetedPower } from './targeted-power';
import type { Tile } from '@/tile';
import { TURN } from '@/stores/game';

export class Blink extends TargetedPower {
  static powerName = 'blink';
  static description = 'Immediately teleport to a new location';
  range = 10;

  useTime = 0;
  coolDown = 20 * TURN;

  canTargetMovementBlocker = false;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.owner.updatePosition(tile);
  }
}
