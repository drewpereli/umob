import { isCreature } from '@/entities/creatures/creature';
import { isDamageable } from '@/entities/damageable';
import { isFlammable, type Flammable } from '@/entities/flammable';
import { DamageType } from '@/entities/weapons/weapon';
import { removeElementNoPreserveOrder } from '@/utils/array';
import { random } from '@/utils/random';
import { defineStore } from 'pinia';
import { useMap } from './map';

export const useBurning = defineStore('burning', {
  state: () => ({
    entitiesBurning: [] as Flammable[],
    _entitiesToRemove: [] as Flammable[],
  }),
  actions: {
    startBurning(f: Flammable) {
      if (f.isBurning) return;

      this.entitiesBurning.push(f);
      f.isBurning = true;
    },
    processBurnTick() {
      this.entitiesBurning.forEach((f) => this.burn(f));

      this._entitiesToRemove.forEach((f) => {
        removeElementNoPreserveOrder(this.entitiesBurning, f);
      });

      this._entitiesToRemove = [];
    },
    burn(flammable: Flammable) {
      if (
        typeof flammable.maxBurningDuration === 'number' &&
        flammable.burningDuration >= flammable.maxBurningDuration
      ) {
        this.stopBurning(flammable);
        return;
      }

      flammable.burningDuration++;

      const map = useMap();

      const collocatedFlammables = flammable.tile.entities
        .filter((e) => e.id !== flammable.id)
        .filter(isFlammable);

      collocatedFlammables.forEach((entity) => {
        const willBurn = random.float(0, 1) < flammable.burnCollocatedChance;

        if (willBurn) {
          if (isCreature(entity)) {
            entity.burningDuration = 0;
          }

          this.startBurning(entity);
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
          if (isCreature(entity)) {
            entity.burningDuration = 0;
          }

          this.startBurning(entity);
        }
      });

      if (isDamageable(flammable)) {
        flammable.receiveDamage(1, DamageType.Heat);
      }

      if (flammable.shouldRemoveFromGame) {
        this.stopBurning(flammable);
      }
    },
    stopBurning(flammable: Flammable) {
      flammable.isBurning = false;
      flammable.burningDuration = 0;
      this._entitiesToRemove.push(flammable);

      if (!isCreature(flammable)) {
        flammable.markForRemoval();
      }
    },
  },
});
