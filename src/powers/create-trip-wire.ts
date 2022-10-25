import { TargetedPower } from './targeted-power';
import { Orientation } from '@/entities/traps/trap';
import { useGame } from '@/stores/game';
import { TripWire } from '@/entities/traps/tripwire';

export class CreateTripWire extends TargetedPower {
  name = 'create tripwire';
  range = 5;

  useTime = 1;
  energyCost = 40;

  currentOrientation = Orientation.Horizontal;

  tilesAimedAt(): Coords[] {
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
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new TripWire(tile, this.currentOrientation);
    this.game.addMapEntity(mine);

    return true;
  }

  rotateAim() {
    this.currentOrientation =
      this.currentOrientation === Orientation.Horizontal
        ? Orientation.Vertical
        : Orientation.Horizontal;
  }
}
