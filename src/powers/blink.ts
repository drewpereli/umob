import { TargetedPower } from './targeted-power';
import type { Tile } from '@/tile';

export class Blink extends TargetedPower {
  static powerName = 'blink';
  static description = 'Immediately teleport to a new location';
  range = 10;

  useTime = 0;
  energyCost = 20;

  canTargetMovementBlocker = false;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.owner.updatePosition(tile);
  }
}
