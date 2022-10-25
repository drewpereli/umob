import { BuildCover } from '@/powers/build-cover';
import { CreateBlackHole } from '@/powers/create-black-hole';
import { Grenade } from '@/powers/grenade';
import { Heal } from '@/powers/heal';
import type { Power } from '@/powers/power';
import { Burning } from '@/status-effects/burning';
import { debugOptions } from '@/utils/debug-options';
import Creature from './creature';
import type { Damageable } from './damageable';
import { defaultBurn, defaultStopBurning, type Flammable } from './flammable';
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

  powers: Power[] = [
    new BuildCover(),
    new CreateBlackHole(),
    new Grenade(),
    new Heal(this),
  ];

  powerHotkeys: Record<string, Power> = this.powers.reduce(
    (acc, power, idx) => {
      if (idx >= 10) return acc;
      const hotKey = idx === 9 ? '0' : `${idx + 1}`;

      acc[hotKey] = power;

      return acc;
    },
    {} as Record<string, Power>
  );

  blocksView = false;

  equippedWeapon = this.inventory[0];

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  energy = debugOptions.infiniteHealth ? Infinity : 100;
  maxEnergy = debugOptions.infiniteHealth ? Infinity : 100;

  viewRange = debugOptions.infiniteViewRange ? Infinity : 10;
  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  mass = 100;

  burnCollocatedChance = 0.5;
  burnAdjacentChance = 0.1;
  burningDuration = 0;
  readonly IMPLEMENTS_FLAMMABLE = true;

  get isBurning() {
    return this.statusEffects.some((effect) => effect.name === 'burning');
  }

  set isBurning(val: boolean) {
    //
  }

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
