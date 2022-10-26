import { Item } from '../items/item';

export const DEFAULT_FLANKING_BONUS = 0.5;

export interface WeaponData {
  damage: number;
  accuracy: number;
  attackTimeMultiplier: number;
  knockBack: number;
  flankingBonus: number;
}

export abstract class Weapon extends Item implements WeaponData {
  abstract damage: number;
  abstract accuracy: number;
  attackTimeMultiplier = 1;
  knockBack = 0;
  flankingBonus = DEFAULT_FLANKING_BONUS;
}

export function itemIsWeapon(item: Item): item is Weapon {
  return item instanceof Weapon;
}
