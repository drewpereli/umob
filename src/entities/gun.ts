export default abstract class Gun {
  abstract damage: number;
  penetration = 0;
  attackTimeMultiplier = 1;
  range = Infinity;
  spread: number | null = null;
}

export class ShotGun extends Gun {
  damage = 10;
  spread = 20;
  range = 10;
}
