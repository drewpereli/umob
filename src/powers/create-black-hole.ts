import { Actor } from '@/entities/actor';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import bresenham from '@/utils/bresnham';
import { dirsBetween, distance } from '@/utils/map';
import { random } from '@/utils/random';
import { TargetedPower } from './targeted-power';

export class CreateBlackHole extends TargetedPower {
  useTime = 2;
  energyCost = 50;
  range = 8;

  tilesAimedAt() {
    const coords: Coords[] = [];

    if (this.game.selectedTile) coords.push(this.game.selectedTile);

    const closest = this.closestValidToSelected();

    if (closest) coords.push(closest);

    return coords;
  }

  activate() {
    const closest = this.closestValidToSelected();

    if (!closest) return;

    this.game.addMapEntity(new BlackHole(closest));

    return true;
  }

  // Don't allow creating a black hole on a tile with an entity that blocks movement (i.e. creature, wall, etc)
  // If the closest selected has such an entity, find the next closest that doesn't have one
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
}

export class BlackHole extends Actor {
  canAct = true;

  blocksMovement = true;

  ticksBeforeDeath = 10;

  range = 5;

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
  }

  get shouldRemoveFromGame() {
    return this.ticksBeforeDeath <= 0;
  }
}
