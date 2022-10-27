import { Terminal } from './terminal';
import type { Door } from '../terrain';

export class DoorTerminal extends Terminal<Door> {
  onInteract() {
    if (this.controls.isOpen) {
      if (this.controls.canClose) {
        this.controls.close();
      }
    } else {
      this.controls.unlock();
      this.controls.open();
    }
  }

  onDestroy() {
    this.controls.open();
  }
}
