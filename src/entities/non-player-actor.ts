import Actor from './actor';

export abstract class NonPlayerActor extends Actor {
  abstract _act(): void;

  actIfPossible() {
    if (!this.canAct) return;

    this._act();
  }
}
