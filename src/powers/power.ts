import { Actor } from '@/entities/actor';
import type Creature from '@/entities/creature';
import { HalfWall } from '@/entities/terrain';
import { ExplosionAnimation } from '@/stores/animations';
import { useGame } from '@/stores/game';
import type { Tile } from '@/stores/map';
import bresenham from '../utils/bresnham';
import { dirsBetween, distance } from '../utils/map';
import { random } from '../utils/random';

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

  closestValidToSelected(): Coords | undefined {
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
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    return this.game.map.tilesInRadius(closest, this.radius);
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    const closest = this.closestValidToSelected();
    if (!closest) return;

    this.actorsAimedAt().forEach((actor) => {
      actor.receiveDamage(5);
    });

    this.game.animations.addAnimation(
      new ExplosionAnimation(closest, this.radius)
    );

    return true;
  }
}

export class CreateBlackHole extends Power {
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

export class BuildCover extends Power {
  range = 2;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    if (this.game.coordsBlocksMovement(closest)) return [];

    return [closest];
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

  activate() {
    const closest = this.closestValidToSelected();
    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    tile.terrain = new HalfWall();

    return true;
  }
}
