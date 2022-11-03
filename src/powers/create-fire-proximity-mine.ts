import { TargetedPower } from './targeted-power';
import { FireProximityMine } from '@/entities/traps/proximity-mine';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { upgradeWithLevel } from '@/utils/types';

export class CreateFireProximityMine extends TargetedPower {
  static powerName = 'create fire proximity mine';
  static description = 'Create a fire proximity mine at the targeted tile';

  coolDown = 20 * TURN;

  canTargetMovementBlocker = true;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const mine = new FireProximityMine(tile);
    this.game.addMapEntity(mine);
  }

  levelDescriptions = ['Range: 5', 'Range: 10', 'Use time: Instant'];

  @upgradeWithLevel([5, 10, 10]) declare range: number;
  @upgradeWithLevel([TURN, TURN, 0]) declare useTime: number;

  maxUpgradeLevel = 3;
}
