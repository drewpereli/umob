import type { Tile } from '@/tile';
import Creature, { CreatureAlignment } from './creature';

export class Rat extends Creature {
  constructor(tile: Tile, alignment?: CreatureAlignment) {
    super(tile, alignment);

    this.unarmedAttackData = {
      ...this.unarmedAttackData,
      attackActionMessageDescription: 'tried to bite',
    };
  }

  name = 'rat';
  mass = 1;
  defaultChar = 'r';
  color = 'white';

  static readonly groupSize: [number, number] = [3, 8];
}
