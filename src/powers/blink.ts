import { TargetedPower } from './targeted-power';
import type { Tile } from '@/tile';
import { TURN } from '@/stores/game';
import { upgradeWithLevel } from '@/utils/types';

export class Blink extends TargetedPower {
  static powerName = 'blink';
  static description = 'Immediately teleport to a new location';

  useTime = 0;

  canTargetMovementBlocker = false;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.owner.updatePosition(tile);
  }

  maxUpgradeLevel = 3;

  levelDescriptions = [
    'Range: 5. Cooldown: 20 Turns.',
    'Range: 10. Cooldown: 10 Turns.',
    'Range: 15. Cooldown: 5 Turns.',
  ];

  @upgradeWithLevel([5, 10, 15]) declare range: number;

  @upgradeWithLevel([20 * TURN, 10 * TURN, 5 * TURN]) declare coolDown: number;
}
