import type { AsciiDrawable } from '@/utils/types';
import type { Damageable } from '../damageable';
import MapEntity, { EntityLayer } from '../map-entity';

export abstract class Barrel
  extends MapEntity
  implements AsciiDrawable, Damageable
{
  char = 'Ø';
  abstract color: string;

  readonly IMPLEMENTS_DAMAGEABLE = true;

  penetrationBlock = 0;

  isCurrentlyDamageable = true;

  blocksMovement = true;
  blocksView = false;

  shouldRemoveFromGame = false;

  mass = 50;

  layer = EntityLayer.Object;

  abstract onDestroy(): void;

  receiveDamage(damage: number) {
    if (damage > 0) {
      this.isCurrentlyDamageable = false;
      this.onDestroy();
      this.markForRemoval();
    }
  }
}
