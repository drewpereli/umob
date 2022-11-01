import type Creature from '@/entities/creatures/creature';
import { Power } from './power';
import bresenham from '../utils/bresenham';
import { distance } from '../utils/map';
import type { Tile } from '@/tile';
import type { Damageable } from '@/entities/damageable';
import type MapEntity from '@/entities/map-entity';

export abstract class TargetedPower extends Power {
  abstract range: number;
  abstract canTargetMovementBlocker: boolean; // Whether you can activate this power on a tile with a movement blocker. e.g. Grenade would be yes, create black hole would be no

  tilesAimedAt(): Tile[] {
    const closest = this.closestValidToSelected();

    return closest ? [closest] : [];
  }

  damageablesAimedAt(): (MapEntity & Damageable)[] {
    return this.tilesAimedAt().flatMap((tile) => this.game.damageablesAt(tile));
  }

  closestValidToSelected(): Tile | undefined {
    if (!this.game.selectedTile)
      throw new Error('Cannot get center without selected tile');

    const range = this.range;

    const dist = distance(this.game.player, this.game.selectedTile);

    let aimedAt: Tile;

    // If the selected tile is farther than the max range of this power
    // Find the farthest valid tile in the line between the player and the selected tile
    // And use that as the selected tile
    if (dist > range) {
      const line = bresenham(this.game.player, this.game.selectedTile);

      const center = line
        .reverse()
        .find((position) => distance(this.game.player, position) <= range);

      if (!center) throw new Error('Could not find closest tile in line');

      aimedAt = this.game.map.tileAt(center);
    } else {
      aimedAt = this.game.selectedTile;
    }

    if (!this.canTargetMovementBlocker && aimedAt.hasEntityThatBlocksMovement) {
      return undefined;
    }

    return aimedAt;
  }

  get canActivate() {
    return this.tilesAimedAt().length > 0;
  }

  activateIfPossible() {
    if (this.canActivate) {
      this.activate();
      return true;
    }

    return false;
  }
}
