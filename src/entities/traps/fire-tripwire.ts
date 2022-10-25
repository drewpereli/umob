import { isFlammable } from '../flammable';
import { TripWire } from './tripwire';

export class FireTripWire extends TripWire {
  onTrigger() {
    this.tilesOccupied.forEach((tile) => {
      tile.entities.forEach((entity) => {
        if (!isFlammable(entity)) return;

        entity.startBurning();
      });
    });
  }
}
