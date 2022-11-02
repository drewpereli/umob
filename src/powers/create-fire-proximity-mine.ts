import { TargetedPower } from './targeted-power';
import { FireProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';

export class CreateFireProximityMine extends TargetedPower {
  static powerName = 'create fire proximity mine';
  static description = 'Create a fire proximity mine at the targeted tile';
  range = 5;

  useTime = TURN;
  energyCost = 20;

  canTargetMovementBlocker = true;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const mine = new FireProximityMine(tile);
    this.game.addMapEntity(mine);
  }
}
