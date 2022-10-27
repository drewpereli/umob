export interface Damageable {
  receiveDamage: (damage: number) => unknown;
  isCurrentlyDamageable: boolean;
  evasionMultiplier?: number; // Represents the entities evade ability. The hit chance will be multiplied by this. So low evasion multiplier corresponds to high evasion. If it's undefined, the entity cannot evade at all, and will always be hit if targeted
  penetrationBlock: number; // How much bullet penetration the entity blocks. If it's 0, you can shoot over the entity
  readonly IMPLEMENTS_DAMAGEABLE: true;
}

export function isDamageable(item: unknown): item is Damageable {
  return !!(item as Record<string, unknown>)['IMPLEMENTS_DAMAGEABLE'];
}
