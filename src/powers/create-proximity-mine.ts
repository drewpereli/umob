import { TargetedPower } from './targeted-power';
import { ProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';
import type { Tile } from '@/stores/map';

export class CreateProximityMine extends TargetedPower {
  readonly name = 'create proximity mine';
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
