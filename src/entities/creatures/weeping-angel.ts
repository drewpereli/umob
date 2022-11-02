import { TURN } from '@/stores/game';
import Creature from './creature';

export class WeepingAngel extends Creature {
  name = 'weeping angel';
  mass = 500;
  defaultChar = 'w';
  color = 'white';

  baseMoveTime = 0.5 * TURN;

  baseViewRange = 30;

  viewAngle = 360;

  _act() {
    const playerVisibleTiles = this.game.visibleTiles;

    if (playerVisibleTiles.includes(this.tile)) return;

    super._act();
  }
}
