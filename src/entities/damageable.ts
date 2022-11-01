import { random } from '@/utils/random';
import type MapEntity from './map-entity';
import type { DamageType } from './weapons/weapon';

export type Damageable = MapEntity & {
  receiveDamage: (damage: number, type: DamageType) => unknown;
  isCurrentlyDamageable: boolean;
  evasion?: number; // Represents the entities evade ability. If it's undefined, the entity cannot evade at all, and will always be hit if targeted
  penetrationBlock: number; // How much bullet penetration the entity blocks. If it's 0, you can shoot over the entity
  readonly IMPLEMENTS_DAMAGEABLE: true;
};

export function isDamageable(item: unknown): item is Damageable {
  return !!(item as Record<string, unknown>)['IMPLEMENTS_DAMAGEABLE'];
}

export function damageRoll(accuracy: number, evasion?: number) {
  if (typeof evasion !== 'number') {
    return true;
  }

  const autoHitOrMiss = random.float() < 0.1;

  if (autoHitOrMiss) {
    return random.bool();
  }

  return random.float(0, accuracy) > random.float(0, evasion);
}
