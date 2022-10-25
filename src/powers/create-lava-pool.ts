import { Lava } from '@/entities/fluid';
import { useMap } from '@/stores/map';
import { TargetedPower } from './targeted-power';

export class CreateLavaPool extends TargetedPower {
  readonly name = 'create lava pool';
  range = 5;
  energyCost = 10;
  useTime = 2;

  // Only allow creating it on floor tiles
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest) return;

    const tile = useMap().tileAt(closest);

    if (tile.terrain) {
      return;
    }

    return closest;
  }

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const pool = new Lava(tile, 7);

    this.game.addMapEntity(pool);

    return true;
  }
}
