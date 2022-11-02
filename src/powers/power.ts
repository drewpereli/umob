import type Creature from '@/entities/creatures/creature';
import { useGame } from '@/stores/game';

export abstract class Power {
  constructor(public owner: Creature) {}

  static powerName: string;
  static description: string;
  abstract useTime: number;
  abstract coolDown: number;

  timeUntilUse = 0;

  game = useGame();

  abstract activate(): void;

  get description(): string {
    return (this.constructor as typeof Power).description;
  }

  get name(): string {
    return (this.constructor as typeof Power).powerName;
  }

  get canActivate() {
    return this.timeUntilUse === 0;
  }

  // Return true if activation successful
  activateIfPossible() {
    console.log(this.canActivate, this.timeUntilUse);

    if (this.canActivate) {
      this.activate();
      this.timeUntilUse = this.coolDown;
      return true;
    }

    return false;
  }

  countdownCoolDown(val: number) {
    this.timeUntilUse = Math.max(this.timeUntilUse - val, 0);
  }
}
