import { debugOptions } from '@/utils/debug-options';
import Creature from './creature';
import type { Damageable } from './damageable';
import { AssaultRifle, Pistol, RailGun, SubMachineGun } from './gun';

export class Player extends Creature {
  defaultChar = '@';
  color = 'yellow';

  inventory = [
    new Pistol(),
    new RailGun(),
    new SubMachineGun(),
    new AssaultRifle(),
  ];

  blocksView = false;

  equippedWeapon = this.inventory[0];

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  mass = 100;

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

  _act() {
    throw new Error('_act should not be called on Player');
  }

  wait() {
    if (!this.canAct) return;

    this.timeUntilNextAction = 1;
  }
}
