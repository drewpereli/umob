import { AutoTurret } from '@/entities/creatures/auto-turret';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class SummonAutoTurret extends TargetedPower {
  canTargetMovementBlocker = false;

  coolDown = 50 * TURN;

  static powerName = 'summon auto-turret';
  static description =
    'Summon an auto turret that attacks your enemies. It lasts until its killed by something.';

  range = 5;

  useTime = TURN;

  activate() {
    const tile = this.closestValidToSelected() as Tile;
    const turret = new AutoTurret(tile, this.owner.alignment);
    turret.health = this.turretHealth;
    turret.maxHealth = this.turretHealth;
    this.game.addMapEntity(turret);
  }

  @upgradeWithLevel([50, 100, 200]) declare turretHealth: number;

  levelDescriptions = [
    'Turret health: 50',
    'Turret health: 100',
    'Turret health: 200',
  ];

  maxUpgradeLevel = 3;
}
