import { StatusEffect } from './status-effect';

export class HypnoticMirroring extends StatusEffect {
  static statusEffectName = 'hypnotic mirroring';

  moveIdsMirrored: string[] = [];
}
