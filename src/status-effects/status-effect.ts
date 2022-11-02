import type Creature from '@/entities/creatures/creature';

export abstract class StatusEffect {
  constructor(public creature: Creature, public maxDuration: number) {
    this.onCreate?.();
  }

  static statusEffectName: string;

  onCreate?(): void;

  // Runs every tick on the creature it belongs to
  affectCreature?(): void;

  onMaxDurationReached() {
    this.destroy();
  }

  destroy() {
    this.creature.removeStatusEffect(this);
  }

  currentDuration = 0;

  // Called in the creature's "tick" function
  tick() {
    this.currentDuration++;

    if (this.currentDuration >= this.maxDuration) {
      this.onMaxDurationReached();

      return;
    }

    this.affectCreature?.();
  }

  get name() {
    return (this.constructor as typeof StatusEffect).statusEffectName;
  }
}
