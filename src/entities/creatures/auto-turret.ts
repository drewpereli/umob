import { TURN } from '@/stores/game';
import Gun from '../weapons/gun';
import { DamageType } from '../weapons/weapon';
import Creature, { Resistance } from './creature';

class AutoTurretGun extends Gun {
  range = 10;
  accuracy = 1;
  clipSize = Infinity;
  amoLoaded = Infinity;
  damage = 10;
  name = '';
  description = '';
}

export class AutoTurret extends Creature {
  defaultChar = 'ф';
  color = 'white';
  mass = 200;
  name = 'auto-turret';

  viewAngle = 360;
  baseViewRange = 5;

  equippedWeapon = new AutoTurretGun();

  attackTime = TURN / 2;

  baseAccuracyMultiplier = 2;

  resistances = {
    [DamageType.Radiation]: Resistance.Immune,
    [DamageType.Heat]: Resistance.Resistant,
    [DamageType.Electric]: Resistance.Vulnerable,
  };

  _act() {
    const attackableEnemy = this.attackableEnemies[0];

    if (attackableEnemy) {
      this.attackTile(attackableEnemy.tile);
    }
  }
}
