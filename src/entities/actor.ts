import Creature from './creature';

export abstract class Actor extends Creature {
  abstract _act(): void;

  actIfPossible() {
    if (!this.canAct) return;

    this._act();
  }
}
