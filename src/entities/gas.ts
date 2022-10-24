import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { random } from '@/utils/random';
import { Actor } from './actor';
import MapEntity, { EntityLayer } from './map-entity';

export function isGas(entity: MapEntity): entity is Gas {
  return entity instanceof Gas;
}

export abstract class Gas extends Actor {
  constructor(tile: Tile, public pressure = 0) {
    super(tile);
  }

  abstract readonly name: string;
  abstract readonly color: string;

  blocksMovement = false;
  blocksView = false;
  mass = 0;
  shouldRemoveFromGame = false;

  reactedThisTick = false; // Whether this fluid has already reacted with another fluid this tick

  readonly layer: EntityLayer = EntityLayer.Gas;

  get canAct() {
    return !this.shouldRemoveFromGame;
  }

  _act() {
    this.pressure -= random.float(0, 0.05);
    if (this.pressure > 0) {
      this._maybeExpand();
    } else {
      this.shouldRemoveFromGame = true;
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

    const candidates = adjacentTiles.filter((tile) => {
      return !tile.terrain && !tile.gas;
    });

    const growTo = random.arrayElement(candidates);

    if (growTo) {
      // @ts-ignore
      const pool: Gas = new this.constructor(growTo, this.pressure);
      useGame().addMapEntity(pool);
    }

    this.pressure--;
  }

  tick() {
    super.tick();
    this.reactedThisTick = false;
  }
}

export class Steam extends Gas {
  name = 'steam';
  color = 'rgba(255,255,255,0.4)';
}
