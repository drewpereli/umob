import { HalfWall } from '@/entities/terrain';
import { Power } from './power';

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
