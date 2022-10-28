import { Power } from './power';

export abstract class NonTargetedPower extends Power {
  activateIfPossible() {
    this.activate();
    return true;
  }
}
