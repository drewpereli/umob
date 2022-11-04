import { Weapon, DEFAULT_FLANKING_BONUS } from './weapon';

export default abstract class MeleeWeapon extends Weapon {
  char = '}';
  color = '#32CD32';
  accuracyBonus = 5;
  attackActionMessageDescription = 'swung at';
}

export class Pipe extends MeleeWeapon {
  name = 'pipe';
  damage = 20;
  attackTimeMultiplier = 2;
  description = "It's a pipe";
}

export class Scalpel extends MeleeWeapon {
  name = 'scalpel';
  description = 'A sharp scalpel. Flanking bonus is doubled.';
  damage = 10;
  flankingBonus = 2 * DEFAULT_FLANKING_BONUS;
}
