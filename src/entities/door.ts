import type { Damageable } from './damageable';
import MapEntity, { EntityLayer } from './map-entity';

export function isDoor(e: MapEntity): e is Door {
  return e instanceof Door;
}

export class Door extends MapEntity implements Damageable {
  type = 'door';
  moveTimeMultiplier = 1;

  layer = EntityLayer.Object;

  isOpen = false;

  get blocksMovement() {
    return !this.isOpen;
  }

  get blocksView() {
    return !this.isOpen;
  }

  get isCurrentlyDamageable() {
    return !this.open;
  }

  readonly IMPLEMENTS_DAMAGEABLE = true;

  penetrationBlock = 1;

  health = 100;

  receiveDamage(damage: number) {
    this.health -= damage;

    if (this.health <= 0) {
      this.shouldRemoveFromGame = true;
    }
  }

  open() {
    this.isOpen = true;
  }

  close() {
    if (this.canClose) {
      this.isOpen = false;
    }
  }

  get canClose() {
    return this.isOpen && !this.tile.hasEntityThatBlocksMovement;
  }

  shouldRemoveFromGame = false;

  mass = 50;
}
