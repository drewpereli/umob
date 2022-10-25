import { createExplosion } from '@/utils/explosions';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';
import { isCreature } from './creature';
import MapEntity, { EntityLayer } from './map-entity';

export function isTrap(entity: MapEntity): entity is Trap {
  return entity instanceof Trap;
}

export abstract class Trap extends Actor {
  blocksMovement = false;
  blocksView = false;

  shouldRemoveFromGame = false;
  triggered = false;

  layer = EntityLayer.Object;

  mass = 1;

  get canAct() {
    return !this.shouldRemoveFromGame && !this.triggered;
  }

  trigger() {
    this.triggered = true;
    this.onTrigger();
    this.shouldRemoveFromGame = true;
  }

  abstract onTrigger(): void;

  _act() {
    const creatureOnTile = this.tile.entities.some(isCreature);

    if (!creatureOnTile) return;

    this.trigger();
  }
}

export class ProximityMine extends Trap implements AsciiDrawable {
  char = '◇';
  color = 'white';

  onTrigger() {
    createExplosion(this.tile, 5, 20);
  }
}
