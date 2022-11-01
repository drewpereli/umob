import type Creature from './entities/creatures/creature';
import { isCreature } from './entities/creatures/creature';
import { type Damageable, isDamageable } from './entities/damageable';
import { type Flammable, isFlammable } from './entities/flammable';
import { type Fluid, isFluid } from './entities/fluid';
import { type Gas, isGas } from './entities/gas';
import { type ItemInMap, isItemInMap } from './entities/items/item-in-map';
import type MapEntity from './entities/map-entity';
import { isTerrain, type Terrain } from './entities/terrain';
import { removeElement } from './utils/array';
import { Cover } from './utils/map';

export class Tile {
  constructor({ x, y }: Coords) {
    this.x = x;
    this.y = y;
  }

  readonly x;
  readonly y;

  adjacentTiles: Tile[] = [];

  terrainLastSeenByPlayer?: TerrainData;

  get moveTimeMultiplier() {
    const terrainMultiplier = this.terrain
      ? this.terrain.moveTimeMultiplier
      : 1;

    if (terrainMultiplier === null) {
      return null;
    }

    const fluidMultiplier = this.fluid?.moveTimeMultiplier ?? 1;

    return terrainMultiplier * fluidMultiplier;
  }

  hasEntityThatBlocksMovement = false;

  hasEntityThatBlocksView = false;

  get terrain() {
    return this.entities.find(isTerrain);
  }

  readonly IMPLEMENTS_DAMAGEABLE = true;

  entities: MapEntity[] = [];

  get id() {
    return `${this.x},${this.y}`;
  }

  onPlayerSees() {
    const terrain = this.terrain ?? FLOOR_TERRAIN_DATA;

    this.terrainLastSeenByPlayer = {
      type: terrain.type,
      char: terrain.char,
      color: terrain.color,
      backgroundColor: terrain.backgroundColor,
    };
  }

  get cover() {
    return this.terrain?.cover ?? Cover.None;
  }

  fluid?: Fluid;

  gas?: Gas;

  items: ItemInMap[] = [];
  flammables: Flammable[] = [];
  creatures: Creature[] = [];
  damageables: Damageable[] = [];

  addEntity(e: MapEntity) {
    if (isFluid(e)) {
      if (this.fluid) return;
      this.fluid = e;
    }

    if (isGas(e)) {
      if (this.gas) return;
      this.gas = e;
    }

    if (isItemInMap(e)) {
      this.items.push(e);
    }
    if (isFlammable(e)) {
      this.flammables.push(e);
    }
    if (isCreature(e)) {
      this.creatures.push(e);
    }
    if (isDamageable(e)) {
      this.damageables.push(e);
    }

    this.entities.push(e);

    if (e.blocksMovement) {
      this.hasEntityThatBlocksMovement = true;
    }

    if (e.blocksView) {
      this.hasEntityThatBlocksView = true;
    }

    // if (isTerrain(e)) {
    //   this.terrain = e;
    //   this.moveTimeMultiplier = e.moveTimeMultiplier;
    // }
  }

  removeEntity(e: MapEntity) {
    removeElement(this.entities, e);

    // if (e === this.terrain) {
    //   this.terrain === undefined;
    //   this.moveTimeMultiplier = 1;
    // }

    if (isFluid(e)) this.fluid = undefined;

    if (isGas(e)) this.gas = undefined;

    if (isItemInMap(e)) {
      removeElement(this.items, e);
    }
    if (isFlammable(e)) {
      removeElement(this.flammables, e);
    }
    if (isCreature(e)) {
      removeElement(this.creatures, e);
    }
    if (isDamageable(e)) {
      removeElement(this.damageables, e);
    }

    if (e.blocksMovement) {
      this.updateBlocksMovement();
    }

    if (e.blocksView) {
      this.updateBlocksView();
    }
  }

  updateBlocksMovement() {
    this.hasEntityThatBlocksMovement = this.entities.some(
      (entity) => entity.blocksMovement
    );
  }

  updateBlocksView() {
    this.hasEntityThatBlocksView = this.entities.some(
      (entity) => entity.blocksView
    );
  }
}

export type TerrainData = Pick<
  Terrain,
  'type' | 'char' | 'color' | 'backgroundColor'
>;

export const FLOOR_TERRAIN_DATA: TerrainData = {
  type: 'floor',
  char: '•',
  color: 'rgba(255,255,255,0.2)',
};
