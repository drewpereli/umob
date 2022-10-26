import type Creature from '@/entities/creatures/creature';
import { Power } from './power';
import bresenham from '../utils/bresenham';
import { distance } from '../utils/map';

export abstract class TargetedPower extends Power {
  abstract range: number;

  tilesAimedAt(): Coords[] {
    const closest = this.closestValidToSelected();

    return closest ? [closest] : [];
  }

  actorsAimedAt() {
    return this.tilesAimedAt().flatMap((tile) => {
      const actor = this.game.creatureAt(tile);

      return actor ? [actor] : [];
    });
  }

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
