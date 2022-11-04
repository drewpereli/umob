import type Creature from '@/entities/creatures/creature';
import { isCreature } from '@/entities/creatures/creature';
import type { Damageable } from '@/entities/damageable';
import type { WeaponData } from '@/entities/weapons/weapon';
import type { Power } from '@/powers/power';
import { defineStore } from 'pinia';

export interface GameMessage {
  content: string;
  color?: string;
}

export const useMessages = defineStore('messages', {
  state: () => ({
    messages: [] as GameMessage[],
  }),
  actions: {
    addMessage(message: GameMessage) {
      this.messages.push(message);
    },
  },
});

export function createAttackMessage(
  attacker: Creature,
  damageablesAimedAt: Damageable[],
  damageablesHit: Damageable[],
  weaponData: WeaponData
): GameMessage {
  let damageablesDescription;

  if (damageablesAimedAt.length === 1) {
    const damageable = damageablesAimedAt[0];

    if (isCreature(damageable)) {
      damageablesDescription = damageable.messageDescriptor;
    } else {
      damageablesDescription = 'something';
    }
  } else {
    if (damageablesAimedAt.every(isCreature)) {
      damageablesDescription = 'the creatures';
    } else {
      damageablesDescription = 'the somethings';
    }
  }

  let hitDescription;
  if (damageablesAimedAt.length == 1) {
    hitDescription = damageablesHit.length === 0 ? 'and missed' : 'and hit';
  } else {
    if (damageablesAimedAt.length === damageablesHit.length) {
      hitDescription = 'and hit all of them';
    } else if (damageablesHit.length === 0) {
      hitDescription = 'and missed all of them';
    } else {
      hitDescription = 'and hit some of them';
    }
  }

  const content = `${attacker.messageDescriptor} ${weaponData.attackActionMessageDescription} ${damageablesDescription} ${hitDescription}`;

  return { content };
}

export function createUsePowerMessage(user: Creature, power: Power) {
  const content = `${user.messageDescriptor} ${power.useMessageDescription}`;

  return { content };
}
