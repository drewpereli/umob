import type { Power } from '@/powers/power';
import type Creature from '../creatures/creature';
import { Item } from './item';

export class Usable extends Item {
  constructor(
    public power: (new (owner: Creature) => Power) & {
      powerName: string;
      description: string;
    }
  ) {
    super();
    this.name = power.powerName;
    this.description = power.description;
  }

  name: string;
  description: string;
  char = '🜛';
  color = 'purple';

  use(creature: Creature) {
    const power = new this.power(creature);
    return power;
  }
}

export function itemIsUsable(item: Item): item is Usable {
  return item instanceof Usable;
}
