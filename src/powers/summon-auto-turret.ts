import { AutoTurret } from '@/entities/creatures/auto-turret';
import { TURN } from '@/stores/game';
import type { Tile } from '@/stores/map';
import { TargetedPower } from './targeted-power';

export class SummonAutoTurret extends TargetedPower {
  canTargetMovementBlocker = false;

  energyCost = 50;

  name = 'summon auto-turret';

  range = 5;

  useTime = TURN;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.game.addMapEntity(new AutoTurret(tile, this.owner.alignment));
  }
}
