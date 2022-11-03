import { Actor } from '@/entities/actor';
import { EntityLayer } from '@/entities/map-entity';
import { useGame } from '@/stores/game';
import type { Tile } from '@/tile';
import { dirsBetween, distance } from '@/utils/map';
import { random } from '@/utils/random';
import { TURN } from '@/utils/turn';
import { upgradeWithLevel } from '@/utils/types';
import { TargetedPower } from './targeted-power';

export class CreateBlackHole extends TargetedPower {
  static powerName = 'create black hole';
  static description =
    'Summon a black hole at the targeted tile. Black holes have a chance to pull nearby creatures towards them.';
  useTime = TURN;
  range = 8;

  canTargetMovementBlocker = false;

  onActivate(tile: Tile) {
    this.game.addMapEntity(new BlackHole(tile, this.blackHoleLifespan));
  }

  maxUpgradeLevel = 3;

  levelDescriptions = [
    'Life-span: 10 Turns. Cooldown: 50 Turns.',
    'Life-span: 20 Turns. Cooldown: 30 Turns.',
    'Life-span: 30 Turns. Cooldown: 10 Turns.',
  ];

  @upgradeWithLevel([10 * TURN, 20 * TURN, 30 * TURN])
  declare blackHoleLifespan: number;

  @upgradeWithLevel([50 * TURN, 30 * TURN, 10 * TURN]) declare coolDown: number;
}

export class BlackHole extends Actor {
  constructor(tile: Tile, public ticksBeforeDeath: number) {
    super(tile);
  }

  canAct = true;

  blocksMovement = true;
  blocksView = true;

  layer = EntityLayer.Object;

  range = 5;

  mass = 1000000000000;

  _act() {
    const game = useGame();

    const creaturesInRange = game.creatures
      .filter((creature) => distance(this, creature) <= this.range)
      .sort((a, b) => {
        return distance(this, a) - distance(this, b);
      });

    creaturesInRange.forEach((creature) => {
      const dist = distance(this, creature);

      const distFraction = dist / this.range;
      const pullProbability = 1 - distFraction;

      const willPull = random.float() < pullProbability;

      if (!willPull) return;

      // Get tile to pull to
      // Start by getting dirs of black hole relative to creature
      const dirs = dirsBetween(creature, this);

      const tilesAtDirs = dirs
        .map((dir) => game.map.adjacentTile(creature, dir))
        .filter((t): t is Tile => !!t);

      // Filter out tiles that cannot be occupied
      const openTiles = tilesAtDirs.filter((tile) =>
        game.creatureCanOccupy(tile)
      );

      if (openTiles.length === 0) return;

      const tile = random.arrayElement(openTiles);

      creature.updatePosition(tile);
    });
  }

  tick(): void {
    this.ticksBeforeDeath--;

    if (this.ticksBeforeDeath <= 0) {
      this.markForRemoval();
    }
  }

  shouldRemoveFromGame = false;
}
