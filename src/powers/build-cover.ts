import { HalfWall } from '@/entities/terrain';
import { useGame } from '@/stores/game';
import { TargetedPower } from './targeted-power';

export class BuildCover extends TargetedPower {
  readonly name = 'build cover';
  useTime = 5;
  energyCost = 30;
  range = 2;

  tilesAimedAt() {
    const closest = this.closestValidToSelected();

    if (!closest) return [];

    if (this.game.coordsBlocksMovement(closest)) return [];

    return [closest];
  }

  activate() {
    const closest = this.closestValidToSelected();
    if (!closest) return;

    const tile = this.game.map.tileAt(closest);

    useGame().addMapEntity(new HalfWall(tile));

    return true;
  }
}
