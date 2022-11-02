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
