import { Terminal } from './terminal';
import type { Door } from '../terrain';

export class DoorTerminal extends Terminal<Door> {
  onInteract() {
    this.controls.forEach((door) => {
      if (door.isOpen) {
        if (door.canClose) {
          door.close();
        }
      } else {
        door.unlock();
        door.open();
      }
    });
  }

  onDestroy() {
    this.controls.forEach((door) => {
      door.open();
    });
  }
}
