import { HalfWall } from '@/entities/terrain';
import type { Tile } from '@/tile';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class BuildCover extends TargetedPower {
  static powerName = 'build cover';
  static description = 'Build a half-cover barricade at the targeted tile';
  range = 2;

  canTargetMovementBlocker = false;

  onActivate(tile: Tile) {
    this.game.addMapEntity(new HalfWall(tile));
  }

  maxUpgradeLevel = 3;

  levelDescriptions = [
    'Use time: 5. Cooldown: 30 Turns.',
    'Use time: 3. Cooldown: 20 Turns.',
    'Use time: 1. Cooldown: 10 Turns.',
  ];

  @upgradeWithLevel([30 * TURN, 20 * TURN, 10 * TURN]) declare coolDown: number;

  @upgradeWithLevel([5 * TURN, 3 * TURN, TURN]) declare useTime: number;
}
