import type Creature from '@/entities/creatures/creature';
import { Resistance } from '@/entities/creatures/creature';
import { DamageType } from '@/entities/weapons/weapon';
import { Burning } from '@/status-effects/burning';
import { TURN } from '@/stores/game';
import { Wearable, WearableSlot } from './wearable';

export abstract class BodyWear extends Wearable {
  readonly wearableSlot = WearableSlot.Body;
  readonly char = '▲';
  readonly color = '#ccc';
}

export class CenturionArmor extends BodyWear {
  static wearableName = 'centurion armor';
  static description =
    'Huge, heavy armor. Gives lots of protection, but moving takes 1 turn longer.';

  armorEffect = 10;
  moveTimeEffect = 1 * TURN;
}

export class FlameSuit extends BodyWear {
  static wearableName = 'flame suit';
  static description =
    'A large, flaming suit. Makes you immune to heat damage.';

  resistances = {
    [DamageType.Heat]: Resistance.Immune,
  };

  effect: Burning | null = null;

  onPutOn(creature: Creature) {
    const effect = new Burning(creature, Infinity, this.id);
    creature.addStatusEffect(effect);
    this.effect = effect;
  }

  onTakeOff(creature: Creature) {
    creature.removeStatusEffect(this.effect as Burning);
    this.effect = null;
  }
}
