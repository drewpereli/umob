import { TargetedPower } from './targeted-power';
import { Orientation } from '@/entities/traps/trap';
import { TURN, useGame } from '@/stores/game';
import { TripWire } from '@/entities/traps/tripwire';
import type { Tile } from '@/stores/map';

export class CreateTripWire extends TargetedPower {
  name = 'create tripwire';
  range = 5;

  useTime = TURN;
  energyCost = 40;

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

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const mine = new TripWire(tile, this.currentOrientation);
    this.game.addMapEntity(mine);
  }

  rotateAim() {
    this.currentOrientation =
      this.currentOrientation === Orientation.Horizontal
        ? Orientation.Vertical
        : Orientation.Horizontal;
  }
}
