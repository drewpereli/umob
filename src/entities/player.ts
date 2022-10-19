import { debugOptions } from '@/utils/debug-options';
import Actor from './actor';
import type { Damageable } from './damageable';
import { AssaultRifle, Pistol, RailGun, SubMachineGun } from './gun';

export class Player extends Actor {
  defaultChar = '@';
  color = 'yellow';

  inventory = [
    new RailGun(),
    new Pistol(),
    new SubMachineGun(),
    new AssaultRifle(),
  ];
  equippedWeapon = this.inventory[0];

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  receiveDamage(damage: number) {
    super.receiveDamage(damage);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }

  hitChanceForDamageable(damageable: Damageable & Coords) {
    if (debugOptions.infiniteAccuracy) return 1;

    return super.hitChanceForDamageable(damageable);
  }
}
