import { NonTargetedPower } from '@/powers/non-targeted-power';
import type { Power } from '@/powers/power';
import { Pull } from '@/powers/pull';
import type { Tile } from '@/tile';
import { tap } from '@/utils/general';
import { distance } from '@/utils/map';
import type { World } from '@/utils/map-generation';
import { random } from '@/utils/random';
import { TURN } from '@/utils/turn';
import { ToxicWaste } from '../fluid';
import { GammaRayLaser } from '../weapons/gun';
import { DamageType } from '../weapons/weapon';
import Creature, { AiState, CreatureAlignment, Resistance } from './creature';

const weapon = new GammaRayLaser();

export class ReanimatedMarieCurie extends Creature {
  constructor(tile: Tile, alignment?: CreatureAlignment) {
    super(tile, alignment);

    const defaultEngagingAction = this._aiStateActions[AiState.Engaging];

    this._aiStateActions = {
      ...this._aiStateActions,
      [AiState.Engaging]: () => {
        const pukeToxicWaste = this.powers.find(
          (p) => p instanceof PukeToxicWaste
        ) as PukeToxicWaste;

        if (pukeToxicWaste.canActivate) {
          const activate = random.float() < 0.05;

          if (activate) {
            this.usePower(pukeToxicWaste);
            return;
          }
        }

        const pull = this.powers.find((p) => p instanceof Pull) as Pull;

        if (pull.canActivate) {
          if (
            this.enemiesSeen.includes(this.game.player) &&
            distance(this.game.player, this) <= pull.range
          ) {
            const activate = random.float() < 0.05;

            if (activate) {
              this.usePower(pull, this.game.player.tile);
              return;
            }
          }
        }

        defaultEngagingAction();
      },
    };
  }

  name = 'reanimated marie curie';
  mass = 100;
  defaultChar = 'M';
  color = 'green';

  baseViewRange = 10;
  baseViewAngle = 180;

  baseResistances = {
    [DamageType.Radiation]: Resistance.Immune,
  };

  receiveRadiation() {
    if (random.float() < 0.1) {
      this.changeHealth(1);
    }
  }

  powers: Power[] = [
    new PukeToxicWaste(this),
    tap(new Pull(this), (p) => (p.currentUpgradeLevel = 2)),
  ];

  inventory = [weapon];
  equippedWeapon = weapon;

  move(tile: Tile) {
    const success = super.move(tile);

    if (success && !this.tile.fluid) {
      const tw = new ToxicWaste(this.tile, 0, 8 * TURN);
      this.game.addMapEntity(tw);
    }

    return success;
  }

  static worldRestrictions: World[] = ['radiation-lab'];
  static boss = true;
}

class PukeToxicWaste extends NonTargetedPower {
  levelDescriptions = [];
  maxUpgradeLevel = 1;

  useTime = 2 * TURN;

  coolDown = 30 * TURN;

  onActivate() {
    const tiles = [this.owner.tile, ...this.owner.tile.adjacentTiles].filter(
      (t) => !t.hasEntityThatBlocksMovement && !t.fluid
    );

    tiles.forEach((t) => {
      const toxicWaste = new ToxicWaste(t, 2);

      this.game.addMapEntity(toxicWaste);
    });
  }
}
