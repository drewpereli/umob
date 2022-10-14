import { debugOptions } from '@/utils/debug-options';
import Actor from './actor';
import { AssaultRifle, Pistol, ShotGun, SubMachineGun } from './gun';

export class Player extends Actor {
  char = '@';
  color = 'yellow';

  inventory = [
    new ShotGun(),
    new Pistol(),
    new SubMachineGun(),
    new AssaultRifle(),
  ];
  equippedWeapon = this.inventory[0];

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  receiveFire(damage: number) {
    super.receiveFire(damage);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }
}
