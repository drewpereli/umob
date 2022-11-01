import type { Tile } from '@/tile';
import { Actor } from '../actor';
import { isCreature } from '../creatures/creature';
import MapEntity, { EntityLayer } from '../map-entity';

export enum Orientation {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export function isTrap(entity: MapEntity): entity is Trap {
  return entity instanceof Trap;
}

export abstract class Trap extends Actor {
  constructor(tile: Tile) {
    super(tile);
    this.setAdditionalTilesOccupied?.();

    if (this.shouldTrigger) {
      this.trigger();
    }
  }

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
    this.markForRemoval();
  }

  abstract onTrigger(): void;

  _act() {
    if (this.shouldTrigger) {
      this.trigger();
    }
  }

  get shouldTrigger() {
    return this.hasCreatureOn;
  }

  get hasCreatureOn() {
    return this.tilesOccupied.some((tile) => {
      return tile.entities.some(isCreature);
    });
  }

  setAdditionalTilesOccupied?(): void;
}
