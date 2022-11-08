import { ExplosionAnimation } from '@/stores/animations';
import { useBurning } from '@/stores/burning';
import { useGame } from '@/stores/game';
import { createExplosion } from '@/utils/explosions';
import type { AsciiDrawable } from '@/utils/types';
import { isFlammable } from '../flammable';
import { Trap } from './trap';

export class ProximityMine extends Trap implements AsciiDrawable {
  char = '◇';
  color = 'white';
  radius = 5;
  damage = 20;

  onTrigger() {
    createExplosion(this.tile, this.radius, this.damage);
  }
}

export class FireProximityMine extends ProximityMine {
  color = 'red';

  onTrigger() {
    const game = useGame();
    const burning = useBurning();

    const tiles = game.map.tilesInRadius(this.tile, this.radius);

    tiles.forEach((tile) => {
      tile.entities.forEach((entity) => {
        if (!isFlammable(entity)) return;

        burning.startBurning(entity);
      });
    });

    game.animations.addAnimation(
      new ExplosionAnimation(this.tile, this.radius)
    );
  }
}
