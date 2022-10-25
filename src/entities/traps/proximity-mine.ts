import { createExplosion } from '@/utils/explosions';
import type { AsciiDrawable } from '@/utils/types';
import { Trap } from './trap';

export class ProximityMine extends Trap implements AsciiDrawable {
  char = '◇';
  color = 'white';

  onTrigger() {
    createExplosion(this.tile, 5, 20);
  }
}
