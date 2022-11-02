import { TargetingArray } from '@/status-effects/targeting-array';
import { TURN } from '@/stores/game';
import { NonTargetedPower } from './non-targeted-power';

export class ActivateTargetingArray extends NonTargetedPower {
  static powerName = 'activate targeting array';
  static description =
    'Activate a targeting array that greatly raises your accuracy while active';
  useTime = 0;
  coolDown = 50 * TURN;

  activate() {
    const effect = new TargetingArray(this.owner, 50);

    this.owner.addStatusEffect(effect);

    return true;
  }
}
