import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { NonTargetedPower } from './non-targeted-power';

export class Heal extends NonTargetedPower {
  static powerName = 'heal';
  static description = 'Heal for 10 health';
  useTime = 2 * TURN;
  coolDown = 20 * TURN;

  onActivate() {
    if (this.owner.health >= this.owner.maxHealth) return;

    this.owner.changeHealth(this.amount);

    return true;
  }

  @upgradeWithLevel([20, 40, 60]) declare amount: number;

  levelDescriptions = ['Heal amount: 20', 'Heal amount: 40', 'Heal amount: 60'];

  maxUpgradeLevel = 3;
}
