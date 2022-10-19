import { debugOptions } from '@/utils/debug-options';
import { NonPlayerActor } from './non-player-actor';

enum Mood {
  Hostile = 'hostile',
}

export class Enemy extends NonPlayerActor {
  mood = Mood.Hostile;

  lastSawPlayerAt: Coords | null = null;

  act() {
    if (debugOptions.docileEnemies) return;

    if (!this.canAct) return;

    if (this.mood === Mood.Hostile) {
      if (this.canAttackPlayer) return this.fireWeapon([this.game.player]);

      if (this.canSeePlayer) {
        const coordsPathToPlayer = this.game.map.pathBetween(
          this.coords,
          this.game.player.coords,
          this
        );

        const coordsTowardsPlayer = coordsPathToPlayer[0];

        if (!coordsTowardsPlayer) return;

        const tile = this.game.map.tileAt(coordsTowardsPlayer);

        if (!this.canMoveTo(tile)) return;

        this.moveOrTurn(tile);
      } else {
        this.wander();
      }
    }
  }

  updatePosition(coords: Coords) {
    super.updatePosition(coords);

    if (this.canSeePlayer) {
      this.lastSawPlayerAt = this.game.player.coords;
    }
  }
}
