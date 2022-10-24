import { useMap } from '@/stores/map';
import { random } from '@/utils/random';
import type { Actor } from './actor';

// Actors that are flammable.
// If an actor is flammable, and its "isBurning" is true,
// it will have its "burn" function called every tick.
// If you're implementing a flammable, consider using
// `defaultStartBurning`, `defaultBurn`, and `defaultStopBurning`
// for the flammable's `startBurning`, `burn`, and `stopBurning`
// functions respectively.

export type Flammable = Actor & {
  isBurning: boolean;
  burnAdjacentChance: number;
  burningDuration: number;
  maxBurningDuration: number;
  readonly IMPLEMENTS_FLAMMABLE: true;
  startBurning: () => unknown;
  burn: () => unknown;
  stopBurning: () => unknown;
};

export function isFlammable(item: unknown): item is Flammable {
  return !!(item as Record<string, unknown>)['IMPLEMENTS_FLAMMABLE'];
}

export function defaultStartBurning(flammable: Flammable) {
  flammable.isBurning = true;
}

export function defaultBurn(flammable: Flammable) {
  if (flammable.burningDuration >= flammable.maxBurningDuration) {
    flammable.stopBurning();
    return;
  }

  flammable.burningDuration++;

  const map = useMap();

  const adjacentFlammables = map
    .adjacentTiles(flammable.tile)
    .flatMap((tile) => tile.entities)
    .filter(isFlammable)
    .filter((entity) => !entity.isBurning);

  adjacentFlammables.forEach((entity) => {
    const willBurn = random.float(0, 1) < flammable.burnAdjacentChance;

    if (willBurn) {
      entity.startBurning();
    }
  });
}

export function defaultStopBurning(flammable: Flammable) {
  flammable.shouldRemoveFromGame = true;
}
