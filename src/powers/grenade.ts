import { ExplosionAnimation } from '@/stores/animations';
import { createExplosion } from '@/utils/explosions';
import { TargetedPower } from './targeted-power';

export class Grenade extends TargetedPower {
  useTime = 2;
  energyCost = 20;
  range = 8;
  radius = 3;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    return this.game.map.tilesInRadius(closest, this.radius);
  }

  activate() {
    const closest = this.closestValidToSelected();
    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    createExplosion(tile, this.radius, 5);

    this.actorsAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(closest, this.radius)
    );

    return true;
  }
}
