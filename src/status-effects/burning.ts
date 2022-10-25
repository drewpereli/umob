import type Creature from '@/entities/creature';
import type { Flammable } from '@/entities/flammable';
import { StatusEffect } from './status-effect';

export class Burning extends StatusEffect {
  constructor(public creature: Creature & Flammable) {
    super(creature);
  }

  name = 'burning';

  onCreate(): void {
    if (!this.creature.isBurning) {
      this.creature.startBurning();
    }
  }

  onMaxDurationReached(): void {
    this.creature.stopBurning();
    super.onMaxDurationReached();
  }

  maxDuration = 20;
}
