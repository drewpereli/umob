import { useBurning } from '@/stores/burning';
import { isFlammable } from '../flammable';
import { TripWire } from './tripwire';

export class FireTripWire extends TripWire {
  onTrigger() {
    const burning = useBurning();

    this.tilesOccupied.forEach((tile) => {
      tile.entities.forEach((entity) => {
        if (!isFlammable(entity)) return;

        burning.startBurning(entity);
      });
    });
  }
}
