import MapEntity from './map-entity';

export abstract class Actor extends MapEntity {
  abstract canAct: boolean;
  abstract _act(): void;

  timeUntilNextAction = 0;

  actIfPossible() {
    if (!this.canAct) return;

    this._act();
  }

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
    }
  }
}
