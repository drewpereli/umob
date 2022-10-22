import { Actor } from '@/entities/actor';
import { EntityLayer } from '@/entities/map-entity';
import { Lava } from '@/entities/terrain';
import { useGame } from '@/stores/game';
import { useMap, type Tile } from '@/stores/map';
import { random } from '@/utils/random';
import { TargetedPower } from './targeted-power';

export class CreateLavaPool extends TargetedPower {
  range = 5;
  energyCost = 10;
  useTime = 2;

  // Only allow creating it on floor tiles
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest) return;

    const tile = useMap().tileAt(closest);

    if (tile.terrain) {
      return;
    }

    return closest;
  }

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const pool = new ExpandingLavaPool(tile);

    this.game.addMapEntity(pool);

    return true;
  }
}

class ExpandingLavaPool extends Actor {
  constructor(tile: Tile, public pressure = 7) {
    super(tile);

    const lava = new Lava(tile);
    useGame().addMapEntity(lava);

    if (pressure === 0) {
      this.canAct = false;
      this.shouldRemoveFromGame = true;
    }
  }

  canAct = true;

  blocksMovement = false;
  blocksView = false;

  layer = EntityLayer.Object;

  mass = 100;

  shouldRemoveFromGame = false;

  _act() {
    if (this.pressure <= 0) {
      this.canAct = false;
      this.shouldRemoveFromGame = true;
    }

    const expandChance = (0.5 * this.pressure) / 10;

    const willExpand = random.float() < expandChance;

    if (!willExpand) {
      return;
    }

    const adjacentTiles = useMap().adjacentTiles(this);

    const candidates = adjacentTiles.filter((tile) => !tile.terrain);

    const growTo = random.arrayElement(candidates);

    if (growTo) {
      const pool = new ExpandingLavaPool(growTo, this.pressure - 1);
      useGame().addMapEntity(pool);
    }

    this.pressure--;
  }
}
