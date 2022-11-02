import type Creature from '@/entities/creatures/creature';
import { Item } from '@/entities/items/item';

export enum WearableSlot {
  Head = 'head',
  Body = 'body',
}

export abstract class Wearable extends Item {
  static wearableName: string;
  static description: string;

  abstract readonly wearableSlot: WearableSlot;

  get description(): string {
    return (this.constructor as typeof Wearable).description;
  }

  get name(): string {
    return (this.constructor as typeof Wearable).wearableName;
  }

  armorEffect = 0;
  moveTimeEffect = 0;

  onPutOn?(creature: Creature): unknown;
  onTakeOff?(creature: Creature): unknown;
}

export function itemIsWearable(item: Item): item is Wearable {
  return item instanceof Wearable;
}
