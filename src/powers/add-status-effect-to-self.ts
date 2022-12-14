import type Creature from '@/entities/creatures/creature';
import { OcclusionVisualizer } from '@/status-effects/occlusion-visualizer';
import { HasteStim, type StatusEffect } from '@/status-effects/status-effect';
import { TargetingArray } from '@/status-effects/targeting-array';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { NonTargetedPower } from './non-targeted-power';

export abstract class AddStatusEffectToSelf extends NonTargetedPower {
  // static powerName = statusEffect.name;
  // static description = statusEffect.description?;

  abstract statusEffect: new (
    creature: Creature,
    maxDuration: number
  ) => StatusEffect;

  useTime = TURN;
  coolDown = 40 * TURN;

  onActivate() {
    const effect = new this.statusEffect(
      this.owner,
      this.statusEffectMaxDuration
    );

    this.owner.addStatusEffect(effect);

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

export class ActivateOcclusionVisualizer extends AddStatusEffectToSelf {
  static powerName = 'activate occlusion visualizer';
  static description =
    'Activates a network of nanobots that feeds you a 360° view of everything around you.';

  statusEffect = OcclusionVisualizer;

  get useMessageDescription() {
    return 'activated an occlusion visualizer';
  }
}

export class ActivateTargetingArray extends AddStatusEffectToSelf {
  static powerName = 'activate targeting array';
  static description =
    'Activate a targeting array that greatly raises your accuracy while active';
  useTime = 0;
  coolDown = 50 * TURN;
  statusEffect = TargetingArray;

  get useMessageDescription() {
    return 'activated a targeting array';
  }
}

export class UseHasteStim extends AddStatusEffectToSelf {
  static powerName = 'use haste stim';
  static description =
    'Inject a stim that lets you move at double speed for a short time.';
  useTime = 0;
  statusEffect = HasteStim;

  get useMessageDescription() {
    return 'started running';
  }
}
