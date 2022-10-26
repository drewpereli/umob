import { createExplosion } from '@/utils/explosions';
import { Barrel } from './barrel';

export class ExplosiveBarrel extends Barrel {
  onDestroy() {
    createExplosion(this.tile, 5, 20);
  }

  color = 'white';
}
