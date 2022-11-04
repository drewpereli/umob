import { ExplosionAnimation } from '@/stores/animations';
import type { Tile } from '@/tile';
import { createExplosion } from '@/utils/explosions';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class Grenade extends TargetedPower {
  static powerName = 'grenade';
  static description = 'Throw a grenade that explodes immediately';
  useTime = TURN;
  coolDown = 4 * TURN;

  canTargetMovementBlocker = true;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    return this.game.map.tilesInRadius(closest, this.radius);
  }

  onActivate(tile: Tile) {
    createExplosion(tile, this.radius, this.damage);

    this.game.animations.addAnimation(
      new ExplosionAnimation(tile, this.radius)
    );

    return true;
  }

  maxUpgradeLevel = 3;

  @upgradeWithLevel([3, 5, 10]) declare radius: number;
  @upgradeWithLevel([8, 12, 20]) declare range: number;
  @upgradeWithLevel([20, 30, 40]) declare damage: number;

  levelDescriptions = [
    'Radius: 3. Range: 8. Damage: 20',
    'Radius: 5. Range: 12. Damage: 30',
    'Radius: 10. Range: 20. Damage: 40',
  ];

  get useMessageDescription() {
    return 'threw a grenade';
  }
}
