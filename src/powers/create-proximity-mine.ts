import { TargetedPower } from './targeted-power';
import bresenham from '@/utils/bresnham';
import { ProximityMine } from '@/entities/trap';

export class CreateProximityMine extends TargetedPower {
  range = 5;

  useTime = 1;
  energyCost = 20;

  // See CreateBlackHole#closest valid to selected. This is the same
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest) return;

    const line = bresenham(this.game.player, closest);

    return line.reverse().find((coords) => {
      const entities = this.game.entitiesAt(coords);

      const nonBlocking = !entities.some((entity) => entity.blocksMovement);

      return nonBlocking;
    });
  }

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new ProximityMine(tile);
    this.game.addMapEntity(mine);

    return true;
  }
}
