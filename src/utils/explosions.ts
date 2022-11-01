import { isDamageable } from '@/entities/damageable';
import { isTrap } from '@/entities/traps/trap';
import { DamageType } from '@/entities/weapons/weapon';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/tile';

export function createExplosion(tile: Tile, radius: number, damage: number) {
  const game = useGame();

  const tiles = game.map.tilesInRadius(tile, radius);

  tiles.forEach((tile) => {
    tile.entities.forEach((entity) => {
      if (isTrap(entity) && !entity.triggered) {
        entity.trigger();
      }

      if (!isDamageable(entity) || !entity.isCurrentlyDamageable) return;

      entity.receiveDamage(damage, DamageType.Physical);
    });
  });

  game.animations.addAnimation(new ExplosionAnimation(tile, radius));
}
