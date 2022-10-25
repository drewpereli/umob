import { useGame } from '@/stores/game';

export abstract class Power {
  abstract readonly name: string;
  abstract useTime: number;
  abstract energyCost: number;

  game = useGame();

  // Return true if activation successful
  abstract activate(): boolean | undefined;
}
