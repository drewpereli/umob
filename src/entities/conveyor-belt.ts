import { useGame } from '@/stores/game';
import { Dir } from '@/utils/map';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';

export class ConveyorBelt extends Actor implements AsciiDrawable {
  constructor(coords: Coords, public dir: Dir) {
    super(coords);
  }

  blocksMovement = false;

  mass = 1000;

  shouldRemoveFromGame = false;

  get char() {
    const dirChars: Record<Dir, string> = {
      [Dir.Up]: '↑↑',
      [Dir.Right]: '»',
      [Dir.Down]: '↓↓',
      [Dir.Left]: '«',
    };

    return dirChars[this.dir];
  }

  color = 'green';

  get canAct() {
    return this.timeUntilNextAction === 0;
  }

  _act(): void {
    const game = useGame();

    const entities = game.entitiesAt(this).filter((e) => e !== this);

    const totalMass = entities.reduce((mass, e) => mass + e.mass, 0);

    if (totalMass > 500) return;

    entities.forEach((entity) => {
      const adjacent = game.map.adjacentTile(entity, this.dir);

      if (adjacent && game.creatureCanOccupy(adjacent)) {
        entity.updatePosition(adjacent);
        this.timeUntilNextAction = 2;
      }
    });
  }
}
