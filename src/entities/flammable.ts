import { Burning } from '@/status-effects/burning';
import { useMap } from '@/stores/map';
import { random } from '@/utils/random';
import type { Actor } from './actor';
import Creature, { isCreature } from './creatures/creature';

// Actors that are flammable.
// If an actor is flammable, and its "isBurning" is true,
// it will have its "burn" function called every tick.
// If you're implementing a flammable, consider using
// `defaultStartBurning`, `defaultBurn`, and `defaultStopBurning`
// for the flammable's `startBurning`, `burn`, and `stopBurning`
// functions respectively.

export type Flammable = Actor & {
  isBurning: boolean;
  burnCollocatedChance: number;
  burnAdjacentChance: number;
  burningDuration: number;
  maxBurningDuration?: number;
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
  if (
    typeof flammable.maxBurningDuration === 'number' &&
    flammable.burningDuration >= flammable.maxBurningDuration
  ) {
    flammable.stopBurning();
    return;
  }

  flammable.burningDuration++;

  const map = useMap();

  const collocatedFlammables = flammable.tile.entities
    .filter((e) => e !== flammable)
    .filter(isFlammable);

  collocatedFlammables.forEach((entity) => {
    const willBurn = random.float(0, 1) < flammable.burnCollocatedChance;

    if (willBurn) {
      if (entity instanceof Creature) {
        entity.addStatusEffect(new Burning(entity));
      } else if (!entity.isBurning) {
        entity.startBurning();
      }
    }
  });

  const adjacentFlammables = map
    .adjacentTiles(flammable.tile)
    .flatMap((tile) => tile.entities)
    .filter(isFlammable);

  adjacentFlammables.forEach((entity) => {
    // Creatures will only catch fire if standing directly in the flames
    if (isCreature(entity)) return;

    const willBurn = random.float(0, 1) < flammable.burnAdjacentChance;

    if (willBurn) {
      entity.startBurning();
    }
  });
}

export function defaultStopBurning(flammable: Flammable) {
  flammable.isBurning = false;
  flammable.burningDuration = 0;
}
