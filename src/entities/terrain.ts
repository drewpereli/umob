import { useGame } from '@/stores/game';
import { Cover } from '@/utils/map';
import type { AsciiDrawable } from '@/utils/types';
import type { Damageable } from './damageable';
import type { Interactable } from './interactable';
import MapEntity, { EntityLayer } from './map-entity';

export type Terrain = MapEntity &
  AsciiDrawable & {
    readonly type: string;
    readonly moveTimeMultiplier: number | null;
    readonly blocksView: boolean;
    readonly cover: Cover;
    readonly char?: string;
    readonly color?: string;
    readonly layer: EntityLayer.Terrain;
  };

export class Wall extends MapEntity implements Terrain, Damageable {
  type = 'wall';
  char = '#';
  color = 'white';
  shouldRemoveFromGame = false;
  blocksMovement = true;
  moveTimeMultiplier = null;
  penetrationBlock = 2;
  blocksView = true;
  mass = 2000;
  cover = Cover.Full;

  readonly layer = EntityLayer.Terrain;

  readonly IMPLEMENTS_DAMAGEABLE = true;

  health = 100;

  receiveDamage(damage: number) {
    this.health -= damage;

    if (this.health <= 0) {
      const halfWall = new HalfWall(this.tile);
      useGame().addMapEntity(halfWall);
      this.shouldRemoveFromGame = true;
    }
  }

  isCurrentlyDamageable = true;
}

export class HalfWall extends MapEntity implements Terrain {
  type = 'half-wall';
  char = '▄';
  blocksView = false;
  blocksMovement = false;
  moveTimeMultiplier = 2;
  color = '#aaa';
  cover = Cover.Half;
  mass = 1000;
  shouldRemoveFromGame = false;
  readonly layer = EntityLayer.Terrain;
}

export function isTerrain(entity: MapEntity): entity is Terrain {
  return entity.layer === EntityLayer.Terrain;
}

export function isDoor(e: MapEntity): e is Door {
  return e instanceof Door;
}

export class Door
  extends MapEntity
  implements Terrain, Damageable, Interactable
{
  type = 'door';
  moveTimeMultiplier = 1;

  readonly layer = EntityLayer.Terrain;

  isOpen = false;

  get blocksMovement() {
    return !this.isOpen;
  }

  get blocksView() {
    return !this.isOpen;
  }

  get isCurrentlyDamageable() {
    return !this.isOpen;
  }

  get cover() {
    return this.isOpen ? Cover.None : Cover.Full;
  }

  get char() {
    return this.isOpen ? '' : '+';
  }

  color = '#e6c66e';
  backgroundColor = '#9c7406';

  readonly IMPLEMENTS_DAMAGEABLE = true;
  readonly IMPLEMENTS_INTERACTABLE = true;

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
    this.tile.updateBlocksMovement();
    this.tile.updateBlocksView();
  }

  close() {
    if (this.canClose) {
      this.isOpen = false;
      this.tile.updateBlocksMovement();
      this.tile.updateBlocksView();
    }
  }

  onInteract() {
    this.open();
  }

  get isCurrentlyInteractable() {
    return !this.isOpen;
  }

  get canClose() {
    return this.isOpen && !this.tile.hasEntityThatBlocksMovement;
  }

  shouldRemoveFromGame = false;

  mass = 50;
}
