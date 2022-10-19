import Creature from './creature';

export abstract class NonPlayerActor extends Creature {
  abstract _act(): void;

  actIfPossible() {
    if (!this.canAct) return;

    this._act();
  }
}
