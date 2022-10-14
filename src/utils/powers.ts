import type Actor from '@/entities/actor';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';

export abstract class Power {
  useTime = 5;

  game = useGame();

  tilesAimedAt(): Coords[] {
    return [];
  }

  actorsAimedAt(): Actor[] {
    return [];
  }

  abstract activate(): void;
}

export class Grenade extends Power {
  tilesAimedAt() {
    if (!this.game.selectedTile) return [];

    return this.game.map.tilesInRadius(this.game.selectedTile, 3);
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.actorAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    this.actorsAimedAt().forEach((actor) => {
      actor.receiveFire(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(this.game.selectedTile, 5)
    );
  }
}
