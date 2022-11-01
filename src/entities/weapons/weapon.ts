import { Item } from '../items/item';

export const DEFAULT_FLANKING_BONUS = 0.5;

export interface WeaponData {
  damage: number;
  accuracyBonus: number;
  attackTimeMultiplier: number;
  knockBack: number;
  flankingBonus: number;
  damageType: DamageType;
}

export abstract class Weapon extends Item implements WeaponData {
  abstract damage: number;
  abstract accuracyBonus: number;
  attackTimeMultiplier = 1;
  knockBack = 0;
  flankingBonus = DEFAULT_FLANKING_BONUS;
  damageType = DamageType.Physical;
}

export function itemIsWeapon(item: Item): item is Weapon {
  return item instanceof Weapon;
}

export enum DamageType {
  Physical = 'physical',
  Radiation = 'radiation',
  Heat = 'heat',
  Electric = 'electric',
}
