import { Smoke, Steam } from '@/entities/gas';
import { ExplosionAnimation } from '@/stores/animations';
import type { Tile } from '@/tile';
import { createExplosion } from '@/utils/explosions';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class SmokeGrenade extends TargetedPower {
  static powerName = 'smoke grenade';
  static description =
    'Throw a smoke grenade that explodes immediately and billows out smoke that obscures the field of battle';
  useTime = TURN;

  canTargetMovementBlocker = true;

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    const smoke = new Smoke(tile, 7);

    this.game.addMapEntity(smoke);

    return true;
  }

  maxUpgradeLevel = 3;

  @upgradeWithLevel([8, 12, 20]) declare range: number;
  @upgradeWithLevel([20 * TURN, 15 * TURN, 10 * TURN]) declare coolDown: number;

  levelDescriptions = [
    'Range: 8. Cooldown: 20',
    'Range: 12. Cooldown: 15',
    'Range: 20. Cooldown: 10',
  ];
}
