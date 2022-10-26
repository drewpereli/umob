import { TargetedPower } from './targeted-power';
import { ProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';

export class CreateProximityMine extends TargetedPower {
  readonly name = 'create proximity mine';
  range = 5;

  useTime = TURN;
  energyCost = 20;

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new ProximityMine(tile);
    this.game.addMapEntity(mine);

    return true;
  }
}
