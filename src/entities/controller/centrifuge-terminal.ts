import type { Centrifuge } from '../centrifuge';
import { Terminal } from './terminal';

export class CentrifugeTerminal extends Terminal<Centrifuge> {
  onInteract() {
    this.controls.forEach((c) => c.toggleOnOff());
  }

  onDestroy() {
    this.controls.forEach((c) => c.turnOff());
  }
}
