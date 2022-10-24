import { useGame } from '@/stores/game';
import { useMap, type Tile } from '@/stores/map';
import { random } from '@/utils/random';
import { Actor } from './actor';
import { isDamageable } from './damageable';
import MapEntity, { EntityLayer } from './map-entity';

export function isFluid(entity: MapEntity): entity is Fluid {
  return entity instanceof Fluid;
}

export abstract class Fluid extends Actor {
  constructor(tile: Tile, public pressure = 0) {
    super(tile);
  }

  abstract readonly name: string;

  blocksMovement = false;
  blocksView = false;
  mass = 0;
  moveTimeMultiplier = 1;
  shouldRemoveFromGame = false;

  reactedThisTick = false; // Whether this fluid has already reacted with another fluid this tick

  readonly layer: EntityLayer = EntityLayer.Fluid;

  get canAct() {
    return !this.shouldRemoveFromGame;
  }

  _act() {
    if (!this.reactedThisTick) {
      this._reactWithOtherFluidsOnTile();
      if (!this.canAct) return;
    }

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

    const candidates = adjacentTiles.filter((tile) => {
      return !tile.terrain && !tile.fluid;
    });

    const growTo = random.arrayElement(candidates);

    if (growTo) {
      // @ts-ignore
      const pool: Fluid = new this.constructor(growTo, this.pressure - 1);
      useGame().addMapEntity(pool);
    }

    this.pressure--;
  }

  _reactWithOtherFluidsOnTile() {
    this.otherFluidsTouching
      .filter((fluid) => !fluid.reactedThisTick)
      .forEach((fluid) => {
        reactFluids(this, fluid);

        if (!this.reactedThisTick) return;
      });
  }

  tick() {
    super.tick();
    this.reactedThisTick = false;
  }

  // Returns fluids on adjacent tiles
  get otherFluidsTouching(): Fluid[] {
    const map = useMap();

    return map.adjacentTiles(this.tile).flatMap((tile) => {
      return tile.entities.filter(
        (entity) => isFluid(entity) && entity !== this
      ) as Fluid[];
    });
  }
}

export class Lava extends Fluid {
  name = 'lava';
  moveTimeMultiplier = 4;

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

export class Water extends Fluid {
  name = 'water';
  moveTimeMultiplier = 2;
}

function reactFluids(a: Fluid, b: Fluid) {
  const names = [a.name, b.name];

  if (names.includes('water') && names.includes('lava')) {
    a.reactedThisTick = true;
    b.reactedThisTick = true;
    a.shouldRemoveFromGame = true;
    b.shouldRemoveFromGame = true;
    return;
  }
}
