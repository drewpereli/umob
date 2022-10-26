import { TargetedPower } from './targeted-power';
import { FireProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';

export class CreateFireProximityMine extends TargetedPower {
  readonly name = 'create fire proximity mine';
  range = 5;

  useTime = TURN;
  energyCost = 20;

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new FireProximityMine(tile);
    this.game.addMapEntity(mine);

    return true;
  }
}
