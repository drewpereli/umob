import { ExplosionAnimation } from '@/stores/animations';
import { Power } from './power';

export class Grenade extends Power {
  range = 8;
  radius = 3;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    return this.game.map.tilesInRadius(closest, this.radius);
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    const closest = this.closestValidToSelected();
    if (!closest) return;

    this.actorsAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(closest, this.radius)
    );

    return true;
  }
}
