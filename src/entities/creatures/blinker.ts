import { Blink } from '@/powers/blink';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { tap } from '@/utils/general';
import { distance, rotateDir } from '@/utils/map';
import type { World } from '@/utils/map-generation';
import { Scalpel } from '../weapons/melee-weapon';
import Creature, { AiState, CreatureAlignment } from './creature';

const weapon = new Scalpel();

export class Blinker extends Creature {
  constructor(tile: Tile, alignment?: CreatureAlignment) {
    super(tile, alignment);

    const defaultEngagingAction = this._aiStateActions[AiState.Engaging];

    this._aiStateActions = {
      ...this._aiStateActions,
      [AiState.Engaging]: () => {
        if (this.maybeBlink()) return;
        defaultEngagingAction();
      },
    };
  }

  mass = 25;
  name = 'blinker';
  defaultChar = 'b';
  color = 'white';

  maxHealth = 50;
  _health = 50;

  equippedWeapon = weapon;
  inventory = [weapon];

  powers: [Blink] = [tap(new Blink(this), (p) => (p.currentUpgradeLevel = 2))];

  maybeBlink(): boolean {
    const blink = this.powers[0];

    if (!blink.canActivate) return false;

    const enemy = this.enemiesSeen[0];

    if (!enemy) return false;

    // If next to enemy and behind it, don't do anything, that's where we want to be
    const tileBehindEnemy = tileBehind(enemy);
    if (!tileBehindEnemy || tileBehindEnemy.id === this.tile.id) return false;

    if (!this.game.creatureCanOccupy(tileBehindEnemy)) return false;

    const distanceTo = distance(this, tileBehindEnemy);

    if (distanceTo > blink.range) return false;

    this.usePower(blink, tileBehindEnemy);

    return true;
  }

  static worldRestrictions: World[] = ['radiation-lab'];
}

function tileBehind(creature: Creature): Tile | undefined {
  const facing = creature.facing;
  const dir = rotateDir(facing, 2);

  return useMap().adjacentTile(creature.tile, dir);
}
