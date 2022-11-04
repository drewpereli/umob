import { CreateTripWire } from './create-trip-wire';
import { FireTripWire } from '@/entities/traps/fire-tripwire';
import type { Tile } from '@/tile';

export class CreateFireTripWire extends CreateTripWire {
  static powerName = 'create fire tripwire';
  static description = 'Create a fire tripwire trap';

  onActivate(tile: Tile) {
    const mine = new FireTripWire(tile, this.currentOrientation);
    this.game.addMapEntity(mine);

    return true;
  }

  get useMessageDescription() {
    return 'laid a fire tripwire trap';
  }
}
