import { TargetedPower } from './targeted-power';
import { Orientation } from '@/entities/traps/trap';
import { useGame } from '@/stores/game';
import { TripWire } from '@/entities/traps/tripwire';
import type { Tile } from '@/tile';
import { upgradeWithLevel } from '@/utils/types';
import { TURN } from '@/utils/turn';

export class CreateTripWire extends TargetedPower {
  static powerName = 'create tripwire';
  static description = 'Create a tripwire trap';

  coolDown = 40 * TURN;

  canTargetMovementBlocker = true;

  currentOrientation = Orientation.Horizontal;

  tilesAimedAt(): Tile[] {
    const closest = super.closestValidToSelected();

    if (!closest) return [];

    const tile = useGame().map.tileAt(closest);

    if (!TripWire.canOccupy(tile)) return [];

    return TripWire.getTilesOccupiedIfCenteredAt(
      closest,
      this.currentOrientation
    ).tiles;
  }

  onActivate(tile: Tile) {
    const mine = new TripWire(tile, this.currentOrientation);
    this.game.addMapEntity(mine);
  }

  rotateAim() {
    this.currentOrientation =
      this.currentOrientation === Orientation.Horizontal
        ? Orientation.Vertical
        : Orientation.Horizontal;
  }

  levelDescriptions = ['Range: 5', 'Range: 10', 'Use time: Instant'];

  @upgradeWithLevel([5, 10, 10]) declare range: number;
  @upgradeWithLevel([TURN, TURN, 0]) declare useTime: number;

  maxUpgradeLevel = 3;

  get useMessageDescription() {
    return 'laid a tripwire trap';
  }
}
