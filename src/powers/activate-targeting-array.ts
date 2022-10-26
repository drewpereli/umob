import { TargetingArray } from '@/status-effects/targeting-array';
import { NonTargetedPower } from './non-targeted-power';

export class ActivateTargetingArray extends NonTargetedPower {
  name = 'activate targeting array';
  useTime = 0;
  energyCost = 50;

  activate() {
    const effect = new TargetingArray(this.owner, 50);

    this.owner.addStatusEffect(effect);

    return true;
  }
}
