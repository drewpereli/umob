import type Creature from '@/entities/creatures/creature';
import { useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import type { Upgradeable } from '@/utils/types';

export abstract class Power implements Upgradeable {
  constructor(public owner: Creature) {}

  static powerName: string;
  static description: string;
  abstract useTime: number;
  abstract coolDown: number;

  get useMessageDescription() {
    return `used ${this.name}`;
  }

  timeUntilUse = 0;

  game = useGame();

  abstract onActivate(tile?: Tile): void;

  get description(): string {
    return (this.constructor as typeof Power).description;
  }

  get name(): string {
    return (this.constructor as typeof Power).powerName;
  }

  get canActivate() {
    return this.timeUntilUse === 0;
  }

  // Player only
  // Return true if activation successful
  playerActivateIfPossible() {
    if (this.canActivate) {
      this.activate();
      return true;
    }

    return false;
  }

  // Call onActivate and set cooldown
  // Player should not call this directly, only AI creatures.
  // Player should use "playerActivateIfPossible"
  activate(tile?: Tile) {
    this.onActivate(tile);
    this.timeUntilUse = this.coolDown;
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

  get ownerIsPlayer() {
    return this.owner.id === 'PLAYER';
  }
}
