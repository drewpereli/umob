import type Creature from '@/entities/creatures/creature';
import { useGame } from '@/stores/game';

export abstract class Power {
  constructor(public owner: Creature) {}

  abstract readonly name: string;
  abstract useTime: number;
  abstract energyCost: number;

  game = useGame();

  // Return true if activation successful
  abstract activateIfPossible(): boolean;
  abstract activate(): void;
}
