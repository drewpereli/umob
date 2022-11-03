import { TargetedPower } from './targeted-power';
import { ProximityMine } from '@/entities/traps/proximity-mine';
import type { Tile } from '@/tile';
import { upgradeWithLevel } from '@/utils/types';
import { TURN } from '@/utils/turn';

export class CreateProximityMine extends TargetedPower {
  static powerName = 'create proximity mine';
  static description = 'Create a proximity mine at the targeted tile';

  coolDown = 20 * TURN;

  canTargetMovementBlocker = true;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const mine = new ProximityMine(tile);
    this.game.addMapEntity(mine);
  }

  levelDescriptions = ['Range: 5', 'Range: 10', 'Use time: Instant'];

  @upgradeWithLevel([5, 10, 10]) declare range: number;
  @upgradeWithLevel([TURN, TURN, 0]) declare useTime: number;

  maxUpgradeLevel = 3;
}
