import { isTrap } from '@/entities/traps/trap';
import { TURN } from '@/stores/game';
import type { Tile } from '@/tile';
import { last } from '@/utils/array';
import bresenham from '@/utils/bresenham';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class Pull extends TargetedPower {
  static powerName = 'pull';
  static description = 'Pull the targeted creatures towards you';
  canTargetMovementBlocker = true;
  useTime = TURN;

  get canActivate() {
    const closest = this.closestValidToSelected() as Tile;
    return super.canActivate && closest.creatures.length > 0;
  }

  activate() {
    const tile = this.closestValidToSelected() as Tile;

    tile.creatures.forEach((creature) => {
      const line = bresenham(creature, this.owner).slice(1);

      const pullThrough: Tile[] = [];

      for (const coords of line) {
        const tile = this.game.map.tileAt(coords);

        if (this.game.creatureCanOccupy(tile)) {
          pullThrough.push(tile);
        } else {
          break;
        }
      }

      if (pullThrough.length) {
        pullThrough.forEach((tile) => {
          tile.entities.forEach((entity) => {
            if (isTrap(entity)) {
              entity.trigger();
            }
          });
        });

        creature.updatePosition(last(pullThrough));
      }
    });
  }

  @upgradeWithLevel([5, 10, 15]) declare range: number;
  @upgradeWithLevel([5 * TURN, 3 * TURN, 0]) declare coolDown: number;

  levelDescriptions = [
    'Range: 5. Cooldown: 5 Turns',
    'Range: 10. Cooldown: 3 Turns',
    'Range: 15. Cooldown: None',
  ];

  maxUpgradeLevel = 3;
}
