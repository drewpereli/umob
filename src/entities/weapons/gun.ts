import { Item } from '../items/item';

export const DEFAULT_FLANKING_BONUS = 0.5;

export default abstract class Gun extends Item {
  abstract damage: number;
  penetration = 0;
  attackTimeMultiplier = 1;
  range = Infinity;
  spread: number | null = null;
  accuracy = 0.5;
  knockBack = 0;
  flankingBonus = DEFAULT_FLANKING_BONUS;
  abstract clipSize: number;
  abstract amoLoaded: number;
  reloadTimeMultiplier = 1;

  char = '¬';
  color = '#32CD32';
}

export class ShotGun extends Gun {
  name = 'shotgun';
  damage = 10;
  spread = 20;
  range = 10;
  attackTimeMultiplier = 4;
  clipSize = 4;
  amoLoaded = 4;
  description = "It's your basic shotgun. It shoots enemies in a cone.";
}

export class Pistol extends Gun {
  name = 'pistol';
  damage = 5;
  range = 5;
  attackTimeMultiplier = 4;
  clipSize = 16;
  amoLoaded = 16;
  description = 'Not a lot of damage';
}

export class AssaultRifle extends Gun {
  name = 'assault rifle';
  damage = 20;
  range = 20;
  penetration = 4;
  attackTimeMultiplier = 10;
  clipSize = 24;
  amoLoaded = 24;
  description = 'High damage and range. Can shoot through multiple enemies.';
  reloadTimeMultiplier = 2;
}

export class SubMachineGun extends Gun {
  name = 'submachine gun';
  damage = 5;
  range = 10;
  penetration = 0;
  attackTimeMultiplier = 1;
  clipSize = 50;
  amoLoaded = 50;
  description = 'Low damage and range, but shoots really fast.';
}

export class RailGun extends Gun {
  name = 'rail gun';
  damage = 5;
  range = 10;
  knockBack = 5;
  clipSize = 8;
  amoLoaded = 8;
  description =
    'Electromagnetic force to accelerate a metal slug to high speeds. Knocks back enemies.';
  reloadTimeMultiplier = 2;
}
