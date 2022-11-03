import { TURN } from '@/stores/game';
import { upgradeWithLevel } from '@/utils/types';
import { NonTargetedPower } from './non-targeted-power';

export class Heal extends NonTargetedPower {
  static powerName = 'heal';
  static description = 'Heal for 10 health';
  useTime = 2 * TURN;
  coolDown = 20 * TURN;

  activate() {
    if (this.owner.health >= this.owner.maxHealth) return;

    this.owner.changeHealth(this.amount);

    return true;
  }

  @upgradeWithLevel([10, 20, 30]) declare amount: number;

  levelDescriptions = ['Heal amount: 10', 'Heal amount: 20', 'Heal amount: 30'];

  maxUpgradeLevel = 3;
}
