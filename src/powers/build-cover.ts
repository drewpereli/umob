import { HalfWall } from '@/entities/terrain';
import { TURN, useGame } from '@/stores/game';
import { TargetedPower } from './targeted-power';

export class BuildCover extends TargetedPower {
  static powerName = 'build cover';
  static description = 'Build a half-cover barricade at the targeted tile';
  useTime = 5 * TURN;
  energyCost = 30;
  range = 2;

  canTargetMovementBlocker = false;

  activate() {
    const tile = this.tilesAimedAt()[0];

    this.game.addMapEntity(new HalfWall(tile));
  }
}
