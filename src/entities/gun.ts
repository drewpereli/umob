export const DEFAULT_FLANKING_BONUS = 0.5;

export default abstract class Gun {
  abstract name: string;
  abstract damage: number;
  abstract description: string;
  penetration = 0;
  attackTimeMultiplier = 1;
  range = Infinity;
  spread: number | null = null;
  accuracy = 0.5;
  knockBack = 0;
  flankingBonus = DEFAULT_FLANKING_BONUS;
}

export class ShotGun extends Gun {
  name = 'shotgun';
  damage = 10;
  spread = 20;
  range = 10;
  attackTimeMultiplier = 4;
  description = "It's your basic shotgun. It shoots enemies in a cone.";
}

export class Pistol extends Gun {
  name = 'pistol';
  damage = 5;
  range = 5;
  attackTimeMultiplier = 4;
  description = 'Not a lot of damage';
}

export class AssaultRifle extends Gun {
  name = 'assault rifle';
  damage = 20;
  range = 20;
  penetration = 4;
  attackTimeMultiplier = 10;
  description = 'High damage and range. Can shoot through multiple enemies.';
}

export class SubMachineGun extends Gun {
  name = 'submachine gun';
  damage = 5;
  range = 10;
  penetration = 0;
  attackTimeMultiplier = 1;
  description = 'Low damage and range, but shoots really fast.';
}

export class RailGun extends Gun {
  name = 'rail gun';
  damage = 5;
  range = 10;
  knockBack = 5;
  description =
    'Electromagnetic force to accelerate a metal slug to high speeds. Knocks back enemies.';
}
