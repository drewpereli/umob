import { Lava } from '@/entities/fluid';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class CreateLavaPool extends TargetedPower {
  static powerName = 'create lava pool';
  static description = 'Create a fire proximity mine at the targeted tile';

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

  maxUpgradeLevel = 3;

  levelDescriptions = [
    'Range: 5. Cooldown: 40 Turns',
    'Range: 10. Cooldown: 30 Turns',
    'Range: 15. Cooldown: 20 Turns',
  ];

  @upgradeWithLevel([5, 10, 15]) declare range: number;
  @upgradeWithLevel([40 * TURN, 30 * TURN, 20 * TURN]) declare coolDown: number;
}
