import { Water } from '@/entities/fluid';
import type { Tile } from '@/tile';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class CreateWaterPool extends TargetedPower {
  static powerName = 'create water pool';
  static description = 'Creates a pool of water surrounding the targeted area';

  useTime = 2 * TURN;

  canTargetMovementBlocker = true;

  // Only allow creating it on floor tiles
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest || closest.terrain) {
      return;
    }

    return closest;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    const pool = new Water(tile, 7);

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
