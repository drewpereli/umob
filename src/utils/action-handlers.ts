import type Gun from '@/entities/gun';
import type { Player } from '@/entities/player';
import type { useGame } from '@/stores/game';
import { Dir } from './map';
import type { Power } from './powers';

export enum ActionUiState {
  Default = 'default',
  Aiming = 'aiming',
  GameOver = 'game-over',
  Inventory = 'inventory',
  AimingPower = 'aiming-power',
  Examining = 'examining',
}

type Game = ReturnType<typeof useGame>;

type KeyHandler = (game: Game) => unknown;

export const actionHandlers: Partial<
  Record<ActionUiState, Record<string, KeyHandler>>
> = {
  [ActionUiState.Default]: {
    ArrowUp: (game) => defaultArrowKey(game, Dir.Up),
    ArrowRight: (game) => defaultArrowKey(game, Dir.Right),
    ArrowDown: (game) => defaultArrowKey(game, Dir.Down),
    ArrowLeft: (game) => defaultArrowKey(game, Dir.Left),
    a: (game) => {
      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, game.player.facing);

      if (!target) {
        return;
      }

      game.setSelectedTile(target);
      game.actionUiState = ActionUiState.Aiming;
    },
    e: (game) => (game.actionUiState = ActionUiState.Inventory),
    x: (game) => {
      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, game.player.facing);

      if (!target) {
        return;
      }

      game.setSelectedTile(target);

      game.actionUiState = ActionUiState.Examining;
    },
    1: (game) => {
      game.player.selectedPower = game.player.powers[0];

      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, game.player.facing);

      if (!target) {
        return;
      }

      game.setSelectedTile(target);

      game.actionUiState = ActionUiState.AimingPower;
    },
    '.': (game) => {
      game.playerWait();
    },
    d: (game) => game.toggleDirectionViewMode(),
  },
  [ActionUiState.Aiming]: {
    ArrowUp: (game) => updateAim(game, Dir.Up),
    ArrowRight: (game) => updateAim(game, Dir.Right),
    ArrowDown: (game) => updateAim(game, Dir.Down),
    ArrowLeft: (game) => updateAim(game, Dir.Left),
    Escape: (game) => {
      game.setSelectedTile(null);
      game.actionUiState = ActionUiState.Default;
    },
    f: (game) => {
      game.playerFireWeapon();
    },
  },
  [ActionUiState.AimingPower]: {
    ArrowUp: (game) => updateAim(game, Dir.Up),
    ArrowRight: (game) => updateAim(game, Dir.Right),
    ArrowDown: (game) => updateAim(game, Dir.Down),
    ArrowLeft: (game) => updateAim(game, Dir.Left),
    Escape: (game) => {
      game.setSelectedTile(null);
      game.actionUiState = ActionUiState.Default;
    },
    f: (game) => {
      game.playerUsePower();
    },
  },
  [ActionUiState.Inventory]: {
    Escape: (game) => (game.actionUiState = ActionUiState.Default),
    ArrowUp: (game) => game.menu.previousItem(),
    ArrowDown: (game) => game.menu.nextItem(),
    Enter: (game) => {
      const weapon = game.menu.selectedItem.model as Gun;
      game.player.equippedWeapon = weapon;
      game.actionUiState = ActionUiState.Default;
    },
  },
  [ActionUiState.Examining]: {
    ArrowUp: (game) => updateAim(game, Dir.Up),
    ArrowRight: (game) => updateAim(game, Dir.Right),
    ArrowDown: (game) => updateAim(game, Dir.Down),
    ArrowLeft: (game) => updateAim(game, Dir.Left),
    Escape: (game) => {
      game.setSelectedTile(null);
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

  game.setSelectedTile(target);
}

function defaultArrowKey(game: Game, dir: Dir) {
  if (game.player.facing === dir) {
    const dirCoordOffset = {
      [Dir.Up]: { y: -1 },
      [Dir.Right]: { x: 1 },
      [Dir.Down]: { y: 1 },
      [Dir.Left]: { x: -1 },
    };

    const offset = dirCoordOffset[dir];

    game.movePlayer(offset);
  } else {
    game.turnPlayer(dir);
  }
}
