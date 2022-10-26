import { useGame } from '@/stores/game';
import { useMap, type Tile } from '@/stores/map';
import { random } from '@/utils/random';
import { Actor } from './actor';
import { isDamageable } from './damageable';
import {
  defaultBurn,
  defaultStartBurning,
  defaultStopBurning,
  type Flammable,
} from './flammable';
import { Steam } from './gas';
import MapEntity, { EntityLayer } from './map-entity';

export function isFluid(entity: MapEntity): entity is Fluid {
  return entity instanceof Fluid;
}

export abstract class Fluid extends Actor {
  constructor(tile: Tile, public pressure = 0) {
    super(tile);
  }

  abstract readonly name: string;
  abstract readonly baseColor: string;

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

export class Lava extends Fluid implements Flammable {
  name = 'lava';
  baseColor = '#f00';
  moveTimeMultiplier = 4;

  isBurning = true;
  burnCollocatedChance = 1;
  burnAdjacentChance = 0.1;
  burningDuration = 0;
  readonly IMPLEMENTS_FLAMMABLE = true;

  startBurning() {
    return;
  }

  burn() {
    defaultBurn(this);
  }

  stopBurning() {
    return;
  }
}

export class Water extends Fluid {
  name = 'water';
  baseColor = '#4287f5';
  moveTimeMultiplier = 2;
}

export class Oil extends Fluid implements Flammable {
  name = 'oil';
  baseColor = '#301934';
  isBurning = false;
  burningDuration = 0;
  maxBurningDuration = 300;
  burnCollocatedChance = 1;
  burnAdjacentChance = 1;
  readonly IMPLEMENTS_FLAMMABLE = true;

  _act(): void {
    super._act();

    if (this.isBurning) {
      this.burningDuration += 1;

      if (this.burningDuration >= this.maxBurningDuration) {
        this.shouldRemoveFromGame = true;
      }
    }
  }

  startBurning() {
    defaultStartBurning(this);
  }

  burn() {
    defaultBurn(this);
  }

  stopBurning() {
    defaultStopBurning(this);
    this.shouldRemoveFromGame = true;
  }
}

function reactFluids(a: Fluid, b: Fluid) {
  const game = useGame();

  const fluids = [a, b];

  const names = fluids.map((f) => f.name);

  if (names.includes('water') && names.includes('lava')) {
    fluids.forEach((f) => {
      f.reactedThisTick = true;
      f.shouldRemoveFromGame = true;

      const steam = new Steam(f.tile, f.pressure);

      game.addMapEntity(steam);
    });

    return;
  }

  if (names.includes('water') && names.includes('oil')) {
    const oil = fluids.find((f) => f.name === 'oil') as Oil;

    if (!oil.isBurning) return;

    oil.stopBurning();

    const steam = new Steam(oil.tile, Math.round(oil.pressure / 2));

    game.addMapEntity(steam);

    return;
  }
}
