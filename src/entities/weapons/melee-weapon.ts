import { Weapon } from './weapon';

export default abstract class MeleeWeapon extends Weapon {
  char = '}';
  color = '#32CD32';
  accuracyBonus = Infinity;
}

export class Pipe extends MeleeWeapon {
  name = 'pipe';
  damage = 20;
  attackTimeMultiplier = 2;
  description = "It's a pipe";
}
