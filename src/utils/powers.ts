import type Creature from '@/entities/creature';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';
import bresenham from './bresnham';
import { distance } from './map';

export abstract class Power {
  useTime = 5;
  range?: number;

  game = useGame();

  tilesAimedAt(): Coords[] {
    return [];
  }

  actorsAimedAt(): Creature[] {
    return [];
  }

  abstract activate(): void;
}

export class Grenade extends Power {
  range = 8;
  radius = 3;

  tilesAimedAt() {
    if (!this.game.selectedTile)
      throw new Error('Cannot get tiles aimed at without selected tile');

    return this.game.map.tilesInRadius(this.centerOfExplosion(), this.radius);
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    if (!this.game.selectedTile) return;

    this.actorsAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(this.centerOfExplosion(), this.radius)
    );
  }

  centerOfExplosion(): Coords {
    if (!this.game.selectedTile)
      throw new Error('Cannot get center without selected tile');

    const dist = distance(this.game.player, this.game.selectedTile);

    // If the selected tile is farther than the max range of this power
    // Find the farthest valid tile in the line between the player and the selected tile
    // And use that as the center of the explosion
    if (dist > this.range) {
      const line = bresenham(this.game.player, this.game.selectedTile);

      const center = line
        .reverse()
        .find((position) => distance(this.game.player, position) <= this.range);

      if (!center) throw new Error('Could not find closest tile in line');

      return center;
    } else {
      return this.game.selectedTile;
    }
  }
}
