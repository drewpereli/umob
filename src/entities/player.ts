import { debugOptions } from '@/utils/debug-options';
import Actor from './actor';
import { AssaultRifle, Pistol, ShotGun, SubMachineGun } from './gun';

export class Player extends Actor {
  defaultChar = '@';
  color = 'yellow';

  inventory = [
    new ShotGun(),
    new Pistol(),
    new SubMachineGun(),
    new AssaultRifle(),
  ];
  equippedWeapon = this.inventory[1];

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  receiveDamage(damage: number) {
    super.receiveDamage(damage);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }
}
