import type Creature from '@/entities/creature';
import { Power } from './power';

export abstract class NonTargetedPower extends Power {
  constructor(public owner: Creature) {
    super();
  }
}
