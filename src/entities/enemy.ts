import { debugOptions } from '@/utils/debug-options';
import { coordsEqual, rotateDir, type Dir } from '@/utils/map';
import { random } from '@/utils/random';
import Creature from './creature';

enum Mood {
  Hostile = 'hostile',
}

export class Enemy extends Creature {
  constructor(coords: Coords) {
    super(coords);
    this.updateLastSawPlayerIfCanSee();
  }

  mood = Mood.Hostile;

  lastSawPlayerAt: Coords | null = null;

  _act() {
    if (debugOptions.docileEnemies) return;

    if (debugOptions.wanderingEnemies) return this._wander();

    if (this.mood === Mood.Hostile) {
      this._actHostile();
    }
  }

  /**
   * If gun is empty, reload
   * else if I can attack the player, attack the player
   * else if I can see the player, move towards the player
   * else if I last saw the player somewhere
   *  If I'm on the tile I last saw them at, turn randomly (look around)
   *  else, move towards where I last saw them
   * else wander
   */
  _actHostile() {
    if (this.mustReload) {
      this.reload();
    } else if (this.canAttackPlayer) {
      this.fireWeapon([this.game.player]);
    } else if (this.canSeePlayer) {
      this._moveTowards(this.game.player);
    } else if (this.lastSawPlayerAt) {
      if (coordsEqual(this, this.lastSawPlayerAt)) {
        const randomTurnSegmentCount = random.polarity();
        const dir = rotateDir(this.facing, randomTurnSegmentCount);
        this.turn(dir);
      } else {
        this._moveTowards(this.lastSawPlayerAt);
      }
    } else {
      this._wander();
    }
  }

  _moveTowards(coords: Coords) {
    const coordsPath = this.game.map.pathBetween(this.coords, coords, this);

    const coordsTowardsTarget = coordsPath[0];

    if (!coordsTowardsTarget) return;

    const tile = this.game.map.tileAt(coordsTowardsTarget);

    if (!this.game.creatureCanOccupy(tile)) return;

    this.moveOrTurn(tile);
  }

  _wander() {
    const adjacentCoords = [
      { x: this.x - 1, y: this.y },
      { x: this.x + 1, y: this.y },
      { x: this.x, y: this.y - 1 },
      { x: this.x, y: this.y + 1 },
    ];

    const tiles = adjacentCoords
      .map((coords) => this.game.map.tileAt(coords))
      .filter((tile) => {
        return tile && this.game.creatureCanOccupy(tile);
      });

    if (tiles.length === 0) return;

    this.moveOrTurn(random.arrayElement(tiles));
  }

  updatePosition(coords: Coords) {
    super.updatePosition(coords);
    this.updateLastSawPlayerIfCanSee();
  }

  updateFacing(dir: Dir) {
    super.updateFacing(dir);
    this.updateLastSawPlayerIfCanSee();
  }

  updateLastSawPlayerIfCanSee() {
    if (this.canSeePlayer) {
      this.lastSawPlayerAt = this.game.player.coords;
    }
  }
}
