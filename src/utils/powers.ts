import { Actor } from '@/entities/actor';
import type Creature from '@/entities/creature';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import bresenham from './bresnham';
import { dirsBetween, distance } from './map';
import { random } from './random';

export abstract class Power {
  useTime = 5;
  range?: number;

  game = useGame();

  tilesAimedAt(): Coords[] {
    return [];
  }

  actorsAimedAt(): Creature[] {
    return [];
  }

  // Return true if activation successful
  abstract activate(): boolean | undefined;

  closestToSelectedWithinRange(): Coords {
    if (!this.game.selectedTile)
      throw new Error('Cannot get center without selected tile');

    const range = this.range;

    if (range === undefined) return this.game.selectedTile;

    const dist = distance(this.game.player, this.game.selectedTile);

    // If the selected tile is farther than the max range of this power
    // Find the farthest valid tile in the line between the player and the selected tile
    // And use that as the selected tile
    if (dist > range) {
      const line = bresenham(this.game.player, this.game.selectedTile);

      const center = line
        .reverse()
        .find((position) => distance(this.game.player, position) <= range);

      if (!center) throw new Error('Could not find closest tile in line');

      return center;
    } else {
      return this.game.selectedTile;
    }
  }
}

export class Grenade extends Power {
  range = 8;
  radius = 3;

  tilesAimedAt() {
    if (!this.game.selectedTile)
      throw new Error('Cannot get tiles aimed at without selected tile');

    return this.game.map.tilesInRadius(
      this.closestToSelectedWithinRange(),
      this.radius
    );
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    if (!this.game.selectedTile) return;

    this.actorsAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(this.closestToSelectedWithinRange(), this.radius)
    );

    return true;
  }
}

export class CreateBlackHole extends Power {
  range = 8;

  tilesAimedAt() {
    return this.game.selectedTile
      ? [this.game.selectedTile, this.closestToSelectedWithinRange()]
      : [];
  }

  activate() {
    if (!this.game.selectedTile) return;

    this.game.addMapEntity(new BlackHole(this.closestToSelectedWithinRange()));

    return true;
  }
}

export class BlackHole extends Actor {
  canAct = true;

  blocksMovement = false;

  ticksBeforeDeath = 50;

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
