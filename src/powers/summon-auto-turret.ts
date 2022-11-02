import { AutoTurret } from '@/entities/creatures/auto-turret';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { TargetedPower } from './targeted-power';

export class SummonAutoTurret extends TargetedPower {
  canTargetMovementBlocker = false;

  energyCost = 50;

  static powerName = 'summon auto-turret';
  static description =
    'Summon an auto turret that attacks your enemies. It lasts until its killed by something.';

  range = 5;

  useTime = TURN;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    this.game.addMapEntity(new AutoTurret(tile, this.owner.alignment));
  }
}
