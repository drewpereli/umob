import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class Push extends TargetedPower {
  static powerName = 'push';
  static description = 'Push the targeted creatures away from you';
  canTargetMovementBlocker = true;
  useTime = TURN;
  range = 7;

  get canActivate() {
    const closest = this.closestValidToSelected() as Tile;
    return super.canActivate && closest.creatures.length > 0;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    tile.creatures.forEach((creature) => {
      creature.receiveKnockBack(0, this.amount, this.owner);
    });
  }

  @upgradeWithLevel([3, 7, 14]) declare amount: number;
  @upgradeWithLevel([5 * TURN, 3 * TURN, 0]) declare coolDown: number;

  levelDescriptions = [
    'Push amount: 3. Cooldown: 5 Turns',
    'Push amount: 7. Cooldown: 3 Turns',
    'Push amount: 14. Cooldown: None',
  ];

  maxUpgradeLevel = 3;
}
