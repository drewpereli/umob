import { Burning } from '@/status-effects/burning';
import { debugOptions } from '@/utils/debug-options';
import Creature from './creature';
import type { Damageable } from './damageable';
import {
  defaultBurn,
  defaultStartBurning,
  defaultStopBurning,
  type Flammable,
} from './flammable';
import { AssaultRifle, Pistol, RailGun, SubMachineGun } from './gun';

export class Player extends Creature implements Flammable {
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

  energy = debugOptions.infiniteHealth ? Infinity : 100;
  maxEnergy = debugOptions.infiniteHealth ? Infinity : 100;

  viewRange = debugOptions.infiniteViewRange ? Infinity : 10;
  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  mass = 100;

  isBurning = false;
  burnCollocatedChance = 0.5;
  burnAdjacentChance = 0.1;
  burningDuration = 0;
  readonly IMPLEMENTS_FLAMMABLE = true;

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

  startBurning() {
    this.isBurning = true;
    this.addStatusEffect(new Burning(this));
  }

  burn() {
    defaultBurn(this);
    this.receiveDamage(1);
  }

  stopBurning() {
    defaultStopBurning(this);
  }
}
