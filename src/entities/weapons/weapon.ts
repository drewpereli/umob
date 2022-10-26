import { Item } from '../items/item';

export const DEFAULT_FLANKING_BONUS = 0.5;

export abstract class Weapon extends Item {
  abstract damage: number;
  abstract accuracy: number;
  attackTimeMultiplier = 1;
  knockBack = 0;
  flankingBonus = DEFAULT_FLANKING_BONUS;
}
