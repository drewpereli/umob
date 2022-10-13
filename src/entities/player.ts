import Actor from './actor';

export class Player extends Actor {
  char = '@';
  color = 'yellow';

  receiveFire(damage: number) {
    super.receiveFire(damage);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }
}
