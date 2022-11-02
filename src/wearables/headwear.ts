import type Creature from '@/entities/creatures/creature';
import { TargetingArray } from '@/status-effects/targeting-array';
import { Wearable, WearableSlot } from './wearable';

export abstract class HeadWear extends Wearable {
  readonly wearableSlot = WearableSlot.Head;
  readonly char = '◓';
  readonly color = '#ccc';
}

export class MilitaryHelmet extends HeadWear {
  static wearableName = 'military helmet';
  static description =
    'A standard-issue military helmet. Gives a little extra armor, but not much else.';

  armorEffect = 3;
}

export class TargetingArrayHelmet extends HeadWear {
  static wearableName = 'targeting array helmet';
  static description = 'Activates permanent targeting array when equipped';

  targetingArray: TargetingArray | null = null;

  onPutOn(creature: Creature) {
    const effect = new TargetingArray(creature, Infinity, this.id);
    creature.addStatusEffect(effect);
    this.targetingArray = effect;
  }

  onTakeOff(creature: Creature) {
    creature.removeStatusEffect(this.targetingArray as TargetingArray);
    this.targetingArray = null;
  }
}
