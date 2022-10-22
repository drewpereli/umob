import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { random } from '@/utils/random';
import { Actor } from './actor';
import { isDamageable } from './damageable';
import { EntityLayer } from './map-entity';

export abstract class Fluid extends Actor {
  constructor(tile: Tile, public pressure = 0) {
    super(tile);
  }

  canAct = true;
  blocksMovement = false;
  blocksView = false;
  mass = 0;
  shouldRemoveFromGame = false;

  readonly layer: EntityLayer = EntityLayer.Fluid;

  _act() {
    if (this.pressure > 0) {
      this._maybeExpand();
    }
  }

  _maybeExpand() {
    const expandChance = (0.5 * this.pressure) / 10;

    const willExpand = random.float() < expandChance;

    if (!willExpand) {
      return;
    }

    const game = useGame();

    const adjacentTiles = game.map.adjacentTiles(this);

    const candidates = adjacentTiles.filter((tile) => !tile.terrain);

    const growTo = random.arrayElement(candidates);

    if (growTo) {
      // @ts-ignore
      const pool: Fluid = new this.constructor(growTo, this.pressure - 1);
      useGame().addMapEntity(pool);
    }

    this.pressure--;
  }
}

export class Lava extends Fluid {
  _act() {
    super._act();

    this.tile.entities.forEach((entity) => {
      if (entity === this) return;

      if (isDamageable(entity)) {
        entity.receiveDamage(20);
      }
    });
  }
}
