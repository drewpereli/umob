import { isDamageable } from '@/entities/damageable';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';

export function createExplosion(tile: Tile, radius: number, damage: number) {
  const game = useGame();

  const tiles = game.map.tilesInRadius(tile, radius);

  tiles.forEach((tile) => {
    tile.entities.forEach((entity) => {
      if (!isDamageable(entity)) return;

      entity.receiveDamage(damage);
    });
  });

  game.animations.addAnimation(new ExplosionAnimation(tile, radius));
}