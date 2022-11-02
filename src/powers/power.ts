import type Creature from '@/entities/creatures/creature';
import { useGame } from '@/stores/game';

export abstract class Power {
  constructor(public owner: Creature) {}

  static powerName: string;
  static description: string;
  abstract useTime: number;
  abstract energyCost: number;

  game = useGame();

  // Return true if activation successful
  abstract activateIfPossible(): boolean;
  abstract activate(): void;

  get description(): string {
    return (this.constructor as typeof Power).description;
  }

  get name(): string {
    return (this.constructor as typeof Power).powerName;
  }
}
