import type { Tile } from '@/tile';
import { FlankingDir } from '@/utils/map';
import { AssaultRifle } from '../weapons/gun';
import Creature, { CreatureAlignment } from './creature';

export class RiotShieldSoldier extends Creature {
  constructor(tile: Tile, alignment?: CreatureAlignment) {
    super(tile, alignment);

    this.baseFlankingDamageMultipliers = {
      ...this.baseFlankingDamageMultipliers,
      [FlankingDir.Front]: -Infinity,
    };

    const rifle = new AssaultRifle();

    this.inventory = [rifle];
    this.equippedWeapon = rifle;
  }

  name = 'riot shield solider';
  mass = 200;
  defaultChar = 's';
  color = '#777';
}
