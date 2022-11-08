import { useGame } from '@/stores/game';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { random } from '@/utils/random';
import { TURN } from '@/utils/turn';
import { Actor } from './actor';
import {
  defaultBurn,
  defaultStartBurning,
  defaultStopBurning,
  type Flammable,
} from './flammable';
import { RadioactiveSmoke, Steam } from './gas';
import MapEntity, { EntityLayer } from './map-entity';

export function isFluid(entity: MapEntity): entity is Fluid {
  return entity instanceof Fluid;
}

export abstract class Fluid extends Actor {
  constructor(
    tile: Tile,
    public pressure = 0,
    public lifeSpan: number | null = null
  ) {
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

  timeAlive = 0;

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
      return !tile.terrain?.blocksMovement && !tile.fluid;
    });

    const growTo = random.arrayElement(candidates);

    if (growTo) {
      const lifeSpan = this.lifeSpan === null ? null : this.lifeSpan - 1;
      // @ts-ignore
      const pool: Fluid = new this.constructor(
        growTo,
        this.pressure - 1,
        lifeSpan
      );
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
    this.timeAlive++;

    if (this.lifeSpan !== null && this.timeAlive >= this.lifeSpan) {
      this.markForRemoval();
    }
  }

  // Returns fluids on adjacent tiles
  get otherFluidsTouching(): Fluid[] {
    return this.tile.adjacentTiles
      .filter((tile) => tile.fluid)
      .map((tile) => tile.fluid as Fluid);
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
  conductsElectricity = true;

  _act() {
    super._act();
    this.tile.flammables.forEach((f) => f.stopBurning());
  }
}

export class Oil extends Fluid implements Flammable {
  name = 'oil';
  baseColor = '#301934';
  isBurning = false;
  burningDuration = 0;
  maxBurningDuration = random.int(80 * TURN, 120 * TURN);
  burnCollocatedChance = 1;
  burnAdjacentChance = 1;
  readonly IMPLEMENTS_FLAMMABLE = true;

  _act(): void {
    super._act();

    if (this.isBurning) {
      this.burningDuration += 1;

      if (this.burningDuration >= this.maxBurningDuration) {
        this.markForRemoval();
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
    this.markForRemoval();
  }
}

function reactFluids(a: Fluid, b: Fluid) {
  const game = useGame();

  const fluids = [a, b];

  const names = fluids.map((f) => f.name);

  if (names.includes('water') && names.includes('lava')) {
    fluids.forEach((f) => {
      if (f.tile.gas) return;

      f.reactedThisTick = true;
      f.markForRemoval();

      const steam = new Steam(f.tile, f.pressure);

      game.addMapEntity(steam);
    });

    return;
  }

  if (names.includes('water') && names.includes('oil')) {
    const oil = fluids.find((f) => f.name === 'oil') as Oil;

    if (!oil.isBurning) return;

    oil.stopBurning();

    if (oil.tile.gas) return;

    const steam = new Steam(oil.tile, Math.round(oil.pressure / 2));

    game.addMapEntity(steam);

    return;
  }

  if (names.includes('toxic-waste') && names.includes('lava')) {
    fluids.forEach((f) => {
      if (f.tile.gas) return;

      f.reactedThisTick = true;
      f.markForRemoval();

      const steam = new RadioactiveSmoke(f.tile, f.pressure);

      game.addMapEntity(steam);
    });

    return;
  }
}

export class ToxicWaste extends Fluid {
  name = 'toxic-waste';
  baseColor = '#00fc04';
  moveTimeMultiplier = 2;

  _act() {
    super._act();

    const map = useMap();

    this.tile.flammables.forEach((f) => f.stopBurning());

    const adjacents = map.adjacentTiles(this.tile);

    adjacents.forEach((tile) => {
      tile.creatures.forEach((creature) => {
        creature.receiveRadiation(1);
      });
    });

    this.tile.creatures.forEach((creature) => {
      creature.receiveRadiation(3);
    });
  }
}
