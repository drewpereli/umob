import type Creature from '@/entities/creatures/creature';
import type { Flammable } from '@/entities/flammable';
import { StatusEffect } from './status-effect';

export class Burning extends StatusEffect {
  constructor(
    public creature: Creature & Flammable,
    public maxDuration: number
  ) {
    super(creature, maxDuration);
  }

  name = 'burning';

  onMaxDurationReached(): void {
    this.creature.stopBurning();
    super.onMaxDurationReached();
  }
}
