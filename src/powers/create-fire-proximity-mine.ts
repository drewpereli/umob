import { TargetedPower } from './targeted-power';
import { FireProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';
import type { Tile } from '@/stores/map';

export class CreateFireProximityMine extends TargetedPower {
  readonly name = 'create fire proximity mine';
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
