export default abstract class Gun {
  abstract name: string;
  abstract damage: number;
  penetration = 0;
  attackTimeMultiplier = 1;
  range = Infinity;
  spread: number | null = null;
  accuracy = 0.5;
  knockBack = 0;
}

export class ShotGun extends Gun {
  name = 'shotgun';
  damage = 10;
  spread = 20;
  range = 10;
  attackTimeMultiplier = 4;
}

export class Pistol extends Gun {
  name = 'pistol';
  damage = 5;
  range = 5;
  attackTimeMultiplier = 4;
}

export class AssaultRifle extends Gun {
  name = 'assault rifle';
  damage = 20;
  range = 20;
  penetration = 4;
  attackTimeMultiplier = 10;
}

export class SubMachineGun extends Gun {
  name = 'submachine gun';
  damage = 5;
  range = 10;
  penetration = 0;
  attackTimeMultiplier = 1;
}

export class RailGun extends Gun {
  name = 'rail gun';
  damage = 5;
  range = 10;
  knockBack = 5;
}
