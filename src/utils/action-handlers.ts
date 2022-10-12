import type { useGame } from '@/stores/game';
import { Dir } from '@/stores/map';

export enum ActionUiState {
  Default = 'default',
  Aiming = 'aiming',
}

type Game = ReturnType<typeof useGame>;

type KeyHandler = (game: Game) => unknown;

export const actionHandlers: Record<
  ActionUiState,
  Record<string, KeyHandler>
> = {
  [ActionUiState.Default]: {
    ArrowUp: (game) => game.movePlayer({ y: -1 }),
    ArrowRight: (game) => game.movePlayer({ x: 1 }),
    ArrowDown: (game) => game.movePlayer({ y: 1 }),
    ArrowLeft: (game) => game.movePlayer({ x: -1 }),
    a: (game) => {
      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, Dir.Up);

      if (!target) {
        return;
      }

      game.selectedTile = target;
      game.actionUiState = ActionUiState.Aiming;
    },
  },
  [ActionUiState.Aiming]: {
    ArrowUp: (game) => updateAim(game, Dir.Up),
    ArrowRight: (game) => updateAim(game, Dir.Right),
    ArrowDown: (game) => updateAim(game, Dir.Down),
    ArrowLeft: (game) => updateAim(game, Dir.Left),
    Escape: (game) => {
      game.selectedTile = null;
      game.actionUiState = ActionUiState.Default;
    },
  },
};

function updateAim(game: Game, dir: Dir) {
  if (!game.selectedTile) {
    return;
  }

  const target = game.map.adjacentTile(game.selectedTile, dir);

  if (!target) {
    return;
  }

  game.selectedTile = target;
}
