import type Creature from '@/entities/creatures/creature';
import { Power } from './power';

export abstract class NonTargetedPower extends Power {
  constructor(public owner: Creature) {
    super();
  }

  activateIfPossible() {
    this.activate();
    return true;
  }
}
