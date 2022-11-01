import { Actor } from '@/entities/actor';
import { EntityLayer } from '@/entities/map-entity';
import { TURN, useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import bresenham from '@/utils/bresenham';
import { dirsBetween, distance } from '@/utils/map';
import { random } from '@/utils/random';
import { TargetedPower } from './targeted-power';

export class CreateBlackHole extends TargetedPower {
  readonly name = 'create black hole';
  useTime = 2 * TURN;
  energyCost = 50;
  range = 8;

  canTargetMovementBlocker = false;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.game.addMapEntity(new BlackHole(tile));
  }
}

export class BlackHole extends Actor {
  canAct = true;

  blocksMovement = true;
  blocksView = true;

  layer = EntityLayer.Object;

  ticksBeforeDeath = 100;

  range = 5;

  mass = 1000000000000;

  _act() {
    const game = useGame();

    const creaturesInRange = game.creatures
      .filter((creature) => distance(this, creature) <= this.range)
      .sort((a, b) => {
        return distance(this, a) - distance(this, b);
      });

    creaturesInRange.forEach((creature) => {
      const dist = distance(this, creature);

      const distFraction = dist / this.range;
      const pullProbability = 1 - distFraction;

      const willPull = random.float() < pullProbability;

      if (!willPull) return;

      // Get tile to pull to
      // Start by getting dirs of black hole relative to creature
      const dirs = dirsBetween(creature, this);

      const tilesAtDirs = dirs
        .map((dir) => game.map.adjacentTile(creature, dir))
        .filter((t): t is Tile => !!t);

      // Filter out tiles that cannot be occupied
      const openTiles = tilesAtDirs.filter((tile) =>
        game.creatureCanOccupy(tile)
      );

      if (openTiles.length === 0) return;

      const tile = random.arrayElement(openTiles);

      creature.updatePosition(tile);
    });
  }

  tick(): void {
    this.ticksBeforeDeath--;

    if (this.ticksBeforeDeath <= 0) {
      this.markForRemoval();
    }
  }

  shouldRemoveFromGame = false;
}
