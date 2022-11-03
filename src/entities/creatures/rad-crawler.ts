import type { Tile } from '@/tile';
import { minBy } from '@/utils/array';
import { coordsEqual, distance, rotateDir } from '@/utils/map';
import { random } from '@/utils/random';
import { ToxicWaste } from '../fluid';
import { DamageType } from '../weapons/weapon';
import Creature, { AiState, CreatureAlignment, Resistance } from './creature';

export class RadCrawler extends Creature {
  constructor(tile: Tile, alignment: CreatureAlignment) {
    super(tile, alignment);

    this.unarmedAttackData = {
      ...this.unarmedAttackData,
      damage: 5,
      accuracyBonus: Infinity,
      attackTimeMultiplier: 1,
      knockBack: 0,
      flankingBonus: 0,
      damageType: DamageType.Radiation,
    };
  }

  name = 'radCrawler';
  description =
    'Heals from radiation. Constantly loses health if not exposed to radiation.';
  defaultChar = 'c';
  color = '#d9ecd9';
  mass = 10;

  maxHealth = 20;
  _health = 20;

  baseResistances = {
    [DamageType.Radiation]: Resistance.Immune,
  };

  receiveRadiation(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  tick() {
    super.tick();

    this.health -= 0.1;
  }

  _aiStateActions: Record<AiState, () => void> = {
    [AiState.Engaging]: () => {
      if (!this.onToxicWaste) {
        return this._moveTowardsToxicWaste();
      }

      const attackableEnemy = this.attackableEnemies[0];
      const visibleEnemy = this.enemiesSeen[0];

      if (attackableEnemy) {
        this.attackTile(attackableEnemy.tile);
      } else if (visibleEnemy) {
        this._moveTowards(visibleEnemy);
      }
    },
    [AiState.Searching]: () => {
      if (!this.onToxicWaste) {
        return this._moveTowardsToxicWaste();
      }

      if (coordsEqual(this.lastSawEnemyAt as Coords, this)) {
        const randomTurnSegmentCount = random.polarity();
        const dir = rotateDir(this.facing, randomTurnSegmentCount);
        this.turn(dir);
      } else {
        this._moveTowards(this.lastSawEnemyAt as Coords);
      }
    },
    [AiState.Idle]: () => {
      if (!this.onToxicWaste) {
        return this._moveTowardsToxicWaste();
      }

      if (random.float(0, 1) < 0.8) return;

      this._wander();
    },
  };

  _wander() {
    if (this.onToxicWaste) {
      const tiles = this.tile.adjacentTiles.filter((tile) => {
        return (
          this.game.creatureCanOccupy(tile) && tile.fluid instanceof ToxicWaste
        );
      });

      if (tiles.length === 0) return;

      this.moveOrTurn(random.arrayElement(tiles));
    } else {
      super._wander();
    }
  }

  _moveTowardsToxicWaste() {
    const visibleToxicWastes = this.game.map
      .tilesInRadius(this, this.viewRange)
      .filter((t) => t.fluid instanceof ToxicWaste);

    const closest = minBy(visibleToxicWastes, (tile) => distance(this, tile));

    if (closest) {
      this._moveTowards(closest);
    } else {
      this._wander();
    }
  }

  get onToxicWaste() {
    return this.tile.fluid instanceof ToxicWaste;
  }

  get _pathfindingValueForTile() {
    if (this.onToxicWaste) {
      return (tile: Tile) => {
        if (!(tile.fluid instanceof ToxicWaste)) return 0;
        return super._pathfindingValueForTile(tile);
      };
    } else {
      return super._pathfindingValueForTile;
    }
  }
}
