import type { Centrifuge } from '../centrifuge';
import { Terminal } from './terminal';

export class CentrifugeTerminal extends Terminal<Centrifuge> {
  onInteract() {
    this.controls.toggleOnOff();
  }

  onDestroy() {
    this.controls.turnOff();
  }
}
