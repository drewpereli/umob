import { TargetedPower } from './targeted-power';
import { ProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';

export class CreateProximityMine extends TargetedPower {
  static powerName = 'create proximity mine';
  static description = 'Create a proximity mine at the targeted tile';
  range = 5;

  useTime = TURN;
  energyCost = 20;

  canTargetMovementBlocker = true;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const mine = new ProximityMine(tile);
    this.game.addMapEntity(mine);
  }
}
