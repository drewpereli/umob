import { useGame } from '@/stores/game';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { Cover, Dir } from '@/utils/map';
import { random } from '@/utils/random';
import { TURN } from '@/utils/turn';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';
import type { Centrifuge } from './centrifuge';
import { Controller } from './controller/controller';
import type { Damageable } from './damageable';
import { ToxicWaste } from './fluid';
import type { Interactable } from './interactable';
import MapEntity, { EntityLayer } from './map-entity';
import { DamageType } from './weapons/weapon';

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

export class Wall extends MapEntity implements Terrain {
  type = 'wall';
  char = '▇';
  color = '#666';
  shouldRemoveFromGame = false;
  blocksMovement = true;
  moveTimeMultiplier = null;
  blocksView = true;
  mass = 2000;
  cover = Cover.Full;

  readonly layer = EntityLayer.Terrain;
}

export class DestructibleWall extends MapEntity implements Terrain, Damageable {
  type = 'destructible-wall';
  char = '▇';
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
      this.markForRemoval();
    }
  }

  isCurrentlyDamageable = true;
}

export class HalfWall extends MapEntity implements Terrain {
  type = 'half-wall';
  char = '▟';
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
  constructor(tile: Tile, public isLocked = false) {
    super(tile);
  }

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

  get backgroundColor() {
    return this.isLocked ? '#8D918D' : '#9c7406';
  }

  readonly IMPLEMENTS_DAMAGEABLE = true;
  readonly IMPLEMENTS_INTERACTABLE = true;

  penetrationBlock = 1;

  health = 100;

  receiveDamage(damage: number) {
    this.health -= damage;

    if (this.health <= 0) {
      this.markForRemoval();
    }
  }

  open() {
    if (this.isLocked) return;
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

  unlock() {
    this.isLocked = false;
  }

  onInteract() {
    this.open();
  }

  get isCurrentlyInteractable() {
    return !this.isOpen && !this.isLocked;
  }

  get canClose() {
    return this.isOpen && !this.tile.hasEntityThatBlocksMovement;
  }

  shouldRemoveFromGame = false;

  mass = 50;
}

export abstract class ButtonWall<T extends MapEntity>
  extends Controller<T>
  implements Terrain, Damageable, Interactable
{
  constructor(tile: Tile, controls: T[], public facing: Dir) {
    super(tile, controls);
    this.interactableFromDir = facing;
  }

  type = 'wall-with-button';
  char = '▇';
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
      this.markForRemoval();
    }
  }

  isCurrentlyDamageable = true;

  readonly IMPLEMENTS_INTERACTABLE = true;
  abstract onInteract(): unknown;
  isCurrentlyInteractable = true;
  interactableFromDir;
}

export class CentrifugeButtonWall extends ButtonWall<Centrifuge> {
  onInteract() {
    this.controls.forEach((c) => c.toggleOnOff());
  }

  onDestroy() {
    this.controls.forEach((c) => c.turnOff());
  }
}

export class ElevatorDown extends MapEntity implements Terrain {
  type = 'elevator-down';
  char = '>';
  color = 'magenta';
  backgroundColor = 'purple';
  blocksView = false;
  blocksMovement = false;
  mass = Infinity;
  shouldRemoveFromGame = false;
  readonly layer = EntityLayer.Terrain;
  cover = Cover.Half;
  moveTimeMultiplier = 1;
}

export class CondensedSteamGenerator extends Actor implements Terrain {
  constructor(tile: Tile, public facing: Dir) {
    super(tile);
  }

  type = 'fire-ball-turret';
  char = '#';
  color = 'red';
  shouldRemoveFromGame = false;
  blocksMovement = true;
  moveTimeMultiplier = null;
  penetrationBlock = 2;
  blocksView = true;
  mass = 2000;
  cover = Cover.Full;

  readonly layer = EntityLayer.Terrain;

  get canAct() {
    return this.timeUntilNextAction <= 0;
  }

  _act() {
    const game = useGame();
    const tile = game.map.adjacentTile(this.tile, this.facing);

    if (!tile) return;

    if (tile.gas || tile.terrain?.blocksMovement) {
      return;
    }

    const steam = new CondensedSteam(tile, this.facing);

    game.addMapEntity(steam);

    this.timeUntilNextAction = 4 * TURN;
  }
}

class CondensedSteam extends Actor implements AsciiDrawable {
  constructor(tile: Tile, public facing: Dir) {
    super(tile);
  }

  char = '*';
  color = 'white';

  blocksMovement = false;
  blocksView = false;
  layer = EntityLayer.Gas;
  mass = 0;
  shouldRemoveFromGame = false;

  timeUntilNextAction = TURN;

  get canAct() {
    return this.timeUntilNextAction <= 0;
  }

  _act() {
    if (this.tile.damageables.length) {
      this.tile.damageables.forEach((d) =>
        d.receiveDamage(10, DamageType.Heat)
      );
      this.markForRemoval();
      return;
    }

    if (this.tile.hasEntityThatBlocksMovement) {
      this.markForRemoval();
      return;
    }

    const game = useGame();
    const tile = game.map.adjacentTile(this.tile, this.facing);

    if (!tile) {
      this.markForRemoval();
      return;
    }

    if (tile.damageables.length) {
      tile.damageables.forEach((d) => d.receiveDamage(10, DamageType.Heat));
      this.markForRemoval();
      return;
    }

    if (tile.hasEntityThatBlocksMovement || tile.gas) {
      this.markForRemoval();
      return;
    }

    this.updatePosition(tile);

    this.timeUntilNextAction = TURN;
  }
}

export class Ruble extends MapEntity implements Terrain {
  type = 'ruble';
  char = '▓';
  blocksView = false;
  blocksMovement = false;
  moveTimeMultiplier = 4;
  color = 'gray';
  cover = Cover.Half;
  mass = 1000;
  shouldRemoveFromGame = false;
  readonly layer = EntityLayer.Terrain;
}

export class Fence extends MapEntity implements Terrain {
  type = 'fence';
  char = '〿';
  blocksView = false;
  blocksMovement = true;
  moveTimeMultiplier = null;
  color = 'gray';
  cover = Cover.None;
  mass = 1000;
  shouldRemoveFromGame = false;
  readonly layer = EntityLayer.Terrain;
}

export class RadSpitter extends MapEntity implements Terrain {
  constructor(tile: Tile, public facing: Dir) {
    super(tile);
  }

  type = 'rad-spitter';
  char = '◙';
  color = '#32CD32';
  blocksMovement = true;
  moveTimeMultiplier = null;
  blocksView = true;
  cover = Cover.Full;
  mass = 2000;
  shouldRemoveFromGame = false;

  readonly layer = EntityLayer.Terrain;

  spit() {
    const spitTo = useMap().adjacentTile(this.tile, this.facing);

    if (!spitTo || spitTo.fluid || spitTo.terrain?.blocksMovement) return;

    const turns = random.int(15, 25) * TURN;

    const toxicWaste = new ToxicWaste(spitTo, 7, turns);

    useGame().addMapEntity(toxicWaste);
  }
}

export class RadSpitterButtonWall extends ButtonWall<RadSpitter> {
  onInteract() {
    this.controls.forEach((c) => c.spit());
  }
}
