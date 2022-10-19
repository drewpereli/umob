import { debugOptions } from '@/utils/debug-options';
import type { Dir } from '@/utils/map';
import { NonPlayerActor } from './non-player-actor';

enum Mood {
  Hostile = 'hostile',
}

export class Enemy extends NonPlayerActor {
  constructor(coords: Coords) {
    super(coords);
    this.updateLastSawPlayerIfCanSee();
  }

  mood = Mood.Hostile;

  lastSawPlayerAt: Coords | null = null;

  _act() {
    if (debugOptions.docileEnemies) return;

    if (this.mood === Mood.Hostile) {
      if (this.canAttackPlayer) return this.fireWeapon([this.game.player]);

      if (this.canSeePlayer || this.lastSawPlayerAt) {
        this._moveTowardsPlayerOrLastSeen();
      } else {
        this.wander();
      }
    }
  }

  _moveTowardsPlayerOrLastSeen() {
    const targetCoords = this.canSeePlayer
      ? this.game.player.coords
      : this.lastSawPlayerAt;

    if (!targetCoords) {
      throw new Error(
        `Called _moveTowardsPlayerOrLastSeen when cant see player and no lastSawPlayerAt`
      );
    }

    const coordsPathToPlayer = this.game.map.pathBetween(
      this.coords,
      targetCoords,
      this
    );

    const coordsTowardsPlayer = coordsPathToPlayer[0];

    if (!coordsTowardsPlayer) return;

    const tile = this.game.map.tileAt(coordsTowardsPlayer);

    if (!this.canMoveTo(tile)) return;

    this.moveOrTurn(tile);
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
