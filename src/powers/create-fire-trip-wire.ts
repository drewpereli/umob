import { CreateTripWire } from './create-trip-wire';
import { FireTripWire } from '@/entities/traps/fire-tripwire';

export class CreateFireTripWire extends CreateTripWire {
  static powerName = 'create fire tripwire';
  static description = 'Create a fire tripwire trap';

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new FireTripWire(tile, this.currentOrientation);
    this.game.addMapEntity(mine);

    return true;
  }
}
