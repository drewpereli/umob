import { Lava } from '@/entities/fluid';
import { TURN } from '@/stores/game';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { TargetedPower } from './targeted-power';

export class CreateLavaPool extends TargetedPower {
  static powerName = 'create lava pool';
  static description = 'Create a fire proximity mine at the targeted tile';
  range = 5;
  coolDown = 40 * TURN;
  useTime = 2 * TURN;

  canTargetMovementBlocker = true;

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
    const tile = this.closestValidToSelected() as Tile;
    const pool = new Lava(tile, 7);
    this.game.addMapEntity(pool);
  }
}
