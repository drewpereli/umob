import { TargetedPower } from './targeted-power';
import bresenham from '@/utils/bresnham';
import { Actor } from '@/entities/actor';
import { EntityLayer } from '@/entities/map-entity';
import { isCreature } from '@/entities/creature';
import { createExplosion } from '@/utils/explosions';
import type { AsciiDrawable } from '@/utils/types';

export class CreateProximityMine extends TargetedPower {
  range = 5;

  useTime = 1;
  energyCost = 20;

  // See CreateBlackHole#closest valid to selected. This is the same
  closestValidToSelected() {
    const closest = super.closestValidToSelected();

    if (!closest) return;

    const line = bresenham(this.game.player, closest);

    return line.reverse().find((coords) => {
      const entities = this.game.entitiesAt(coords);

      const nonBlocking = !entities.some((entity) => entity.blocksMovement);

      return nonBlocking;
    });
  }

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    const mine = new ProximityMine(tile);
    this.game.addMapEntity(mine);

    return true;
  }
}

export class ProximityMine extends Actor implements AsciiDrawable {
  blocksMovement = false;
  blocksView = false;

  shouldRemoveFromGame = false;

  layer = EntityLayer.Object;

  mass = 1;

  char = '◇';
  color = 'white';

  get canAct() {
    return !this.shouldRemoveFromGame;
  }

  _act() {
    const creatureOnTile = this.tile.entities.some(isCreature);

    if (!creatureOnTile) return;

    createExplosion(this.tile, 5, 20);

    this.shouldRemoveFromGame = true;
  }
}
