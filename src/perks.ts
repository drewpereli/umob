import type { Player } from '@/entities/player';
import { TargetingArray } from './status-effects/targeting-array';

export interface Perk {
  id: string;
  name: string;
  description: string;
  applyEffect: (player: Player) => void;
}

const perksWithoutIds: Omit<Perk, 'id'>[] = [
  {
    name: 'constitution boost',
    description: 'increase health by 50%',
    applyEffect(player: Player) {
      player.maxHealth *= 1.5;
      player.health = player.maxHealth;
    },
  },
  {
    name: 'capacity boost',
    description: 'increase energy by 50%',
    applyEffect(player: Player) {
      player.maxEnergy *= 1.5;
      player.energy = player.maxEnergy;
    },
  },
  {
    name: 'quick charge',
    description: 'double energy recharge rate',
    applyEffect(player: Player) {
      player.baseEnergyRechargePerTick *= 2;
      player.energy = player.maxEnergy;
    },
  },
  {
    name: 'permanent targeting array',
    description: 'install a targeting array that gives you 100% accuracy',
    applyEffect(player: Player) {
      const targetingArray = new TargetingArray(player, Infinity);
      player.addStatusEffect(targetingArray);
    },
  },
];

export const perks: Perk[] = perksWithoutIds.map((perk, idx) => {
  return {
    ...perk,
    id: `${idx}`,
  };
});
