import { useGame } from '@/stores/game';

export abstract class Power {
  useTime = 5;

  game = useGame();

  // Return true if activation successful
  abstract activate(): boolean | undefined;
}
