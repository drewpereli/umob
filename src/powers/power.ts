import type Creature from '@/entities/creatures/creature';
import { useGame } from '@/stores/game';
import type { Upgradeable } from '@/utils/types';

export abstract class Power implements Upgradeable {
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

  currentUpgradeLevel = 1;
  abstract maxUpgradeLevel: number;

  get canUpgrade() {
    return this.currentUpgradeLevel < this.maxUpgradeLevel;
  }

  upgrade() {
    if (this.canUpgrade) {
      this.currentUpgradeLevel++;
    }
  }

  abstract levelDescriptions: string[];
}
