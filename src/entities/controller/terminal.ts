import type { Tile } from '@/tile';
import { angleFromDir, type Dir } from '@/utils/map';
import type { AsciiDrawable } from '@/utils/types';
import type { Damageable } from '../damageable';
import type { Interactable } from '../interactable';
import type MapEntity from '../map-entity';
import { EntityLayer } from '../map-entity';
import { Controller } from './controller';

export abstract class Terminal<T extends MapEntity>
  extends Controller<T>
  implements Interactable, Damageable, AsciiDrawable
{
  constructor(tile: Tile, public controls: T, public facing: Dir) {
    super(tile, controls);
    this.interactableFromDir = facing;
  }

  health = 100;

  blocksView = false;
  blocksMovement = true;
  layer = EntityLayer.Object;
  mass = 100;
  shouldRemoveFromGame = false;

  readonly IMPLEMENTS_INTERACTABLE = true;
  abstract onInteract(): unknown;
  isCurrentlyInteractable = true;
  interactableFromDir;

  readonly IMPLEMENTS_DAMAGEABLE = true;
  isCurrentlyDamageable = true;
  penetrationBlock = 0;

  receiveDamage(damage: number) {
    this.health = Math.max(0, this.health - damage);

    if (this.health === 0) {
      this.onDestroy?.();
      this.markForRemoval();
    }
  }

  char = 'Ǖ';
  // ⍓
  color = '#6ba9fa';
  get rotateChar() {
    return angleFromDir(this.facing) + 90;
  }

  onDestroy?(): unknown;
}
