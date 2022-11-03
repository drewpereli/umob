import type Creature from '@/entities/creatures/creature';
import { HypnoticMirroring } from '@/status-effects/hypnotic-mirroring';
import { OcclusionVisualizer } from '@/status-effects/occlusion-visualizer';
import type { StatusEffect } from '@/status-effects/status-effect';
import { TargetingArray } from '@/status-effects/targeting-array';
import type { Tile } from '@/tile';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { NonTargetedPower } from './non-targeted-power';
import { TargetedPower } from './targeted-power';

export abstract class AddStatusEffectToOther extends TargetedPower {
  // static powerName = statusEffect.name;
  // static description = statusEffect.description?;

  abstract statusEffect: new (
    creature: Creature,
    maxDuration: number
  ) => StatusEffect;

  useTime = TURN;
  coolDown = 40 * TURN;
  canTargetMovementBlocker = true;

  range = 10;

  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest) return;

    if (!closest.creatures.length) return;

    return closest;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    tile.creatures.forEach((creature) => {
      const effect = new this.statusEffect(
        creature,
        this.statusEffectMaxDuration
      );

      creature.addStatusEffect(effect);
    });

    return true;
  }

  maxUpgradeLevel = 3;

  @upgradeWithLevel([10 * TURN, 20 * TURN, 30 * TURN])
  declare statusEffectMaxDuration: number;

  levelDescriptions = [
    'Duration: 10 Turns',
    'Duration: 20 Turns',
    'Duration: 30 Turns',
  ];
}

export class Hypnotize extends AddStatusEffectToOther {
  static powerName = 'hypnotize';
  static description =
    'Hypnotize a creature, forcing them to mirror your movements';

  useTime = 0;

  statusEffect = HypnoticMirroring;
}
