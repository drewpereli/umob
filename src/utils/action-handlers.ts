import type Gun from '@/entities/gun';
import type { useGame } from '@/stores/game';
import { Dir } from './map';

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
    e: (game) => (game.actionUiState = ActionUiState.Inventory),
    x: (game) => {
      game.player.selectedPower = game.player.powers[0];

      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, Dir.Up);

      if (!target) {
        return;
      }

      game.selectedTile = target;

      game.actionUiState = ActionUiState.Examining;
    },
    1: (game) => {
      game.player.selectedPower = game.player.powers[0];

      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, Dir.Up);

      if (!target) {
        return;
      }

      game.selectedTile = target;

      game.actionUiState = ActionUiState.AimingPower;
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
      game.selectedTile = null;
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
