import { ExplosionAnimation } from '@/stores/animations';
import { TURN } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { createExplosion } from '@/utils/explosions';
import { TargetedPower } from './targeted-power';

export class Grenade extends TargetedPower {
  readonly name = 'grenade';
  useTime = 2 * TURN;
  energyCost = 20;
  range = 8;
  radius = 3;

  canTargetMovementBlocker = true;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    return this.game.map.tilesInRadius(closest, this.radius);
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    createExplosion(tile, this.radius, 5);

    this.damageablesAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(tile, this.radius)
    );

    return true;
  }
}
