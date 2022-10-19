import Actor from './actor';

export class Enemy extends Actor {
  lastSawPlayerAt: Coords | null = null;

  updatePosition(coords: Coords) {
    super.updatePosition(coords);

    if (this.canSeePlayer) {
      this.lastSawPlayerAt = this.game.player.coords;
    }
  }
}
