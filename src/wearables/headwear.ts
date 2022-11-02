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
