import { TURN } from '@/stores/game';
import Gun from '../weapons/gun';
import { DamageType } from '../weapons/weapon';
import Creature, { Resistance } from './creature';

class AutoTurretGun extends Gun {
  range = 10;
  accuracyBonus = 1;
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

  baseViewAngle = 360;
  baseViewRange = 5;

  equippedWeapon = new AutoTurretGun();

  attackTime = TURN / 2;

  baseAccuracyMultiplier = 2;

  baseResistances = {
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
