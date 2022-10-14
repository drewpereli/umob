export default abstract class Gun {
  abstract damage: number;
  penetration = 0;
  attackTimeMultiplier = 1;
  range = Infinity;
  spread: number | null = null;
  accuracy = 0.5;
}

export class ShotGun extends Gun {
  damage = 10;
  spread = 20;
  range = 10;
  attackTimeMultiplier = 4;
}

export class Pistol extends Gun {
  damage = 5;
  range = 5;
  attackTimeMultiplier = 4;
}

export class AssaultRifle extends Gun {
  damage = 20;
  range = 20;
  penetration = 4;
  attackTimeMultiplier = 10;
}

export class SubMachineGun extends Gun {
  damage = 5;
  range = 10;
  penetration = 0;
  attackTimeMultiplier = 1;
}
