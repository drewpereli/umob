import { useGame } from '@/stores/game';

export abstract class Power {
  abstract useTime: number;
  abstract energyCost: number;

  game = useGame();

  // Return true if activation successful
  abstract activate(): boolean | undefined;
}
