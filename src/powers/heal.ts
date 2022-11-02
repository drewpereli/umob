import { TURN } from '@/stores/game';
import { NonTargetedPower } from './non-targeted-power';

export class Heal extends NonTargetedPower {
  static powerName = 'heal';
  static description = 'Heal for 10 health';
  useTime = 2 * TURN;
  energyCost = 10;

  activate() {
    if (this.owner.health >= this.owner.maxHealth) return;

    this.owner.changeHealth(10);

    return true;
  }
}
