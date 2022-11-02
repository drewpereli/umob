import { ElevatorDown, isDoor } from '@/entities/terrain';
import { NonTargetedPower } from '@/powers/non-targeted-power';
import { TargetedPower } from '@/powers/targeted-power';
import type { useGame } from '@/stores/game';
import { Dir } from './map';
import { weaponIsGun } from '@/entities/weapons/gun';

export enum ActionUiState {
  Default = 'default',
  Aiming = 'aiming',
  GameOver = 'game-over',
  AimingPower = 'aiming-power',
  Examining = 'examining',
}

export enum MetaUiState {
  Default = 'default',
  Inventory = 'inventory',
  PowersList = 'powers-list',
  PerksList = 'perks-list',
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
    'ArrowUp+Shift': (game) => defaultArrowKey(game, Dir.Up, true),
    'ArrowRight+Shift': (game) => defaultArrowKey(game, Dir.Right, true),
    'ArrowDown+Shift': (game) => defaultArrowKey(game, Dir.Down, true),
    'ArrowLeft+Shift': (game) => defaultArrowKey(game, Dir.Left, true),
    a: (game) => {
      if (
        !game.player.equippedWeapon ||
        !weaponIsGun(game.player.equippedWeapon)
      )
        return;

      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, game.player.facing);

      if (!target) {
        return;
      }

      game.setSelectedTile(target);
      game.actionUiState = ActionUiState.Aiming;
    },
    r: (game) => game.playerReload(),
    p: (game) => (game.metaUiState = MetaUiState.PowersList),
    u: (game) => (game.metaUiState = MetaUiState.PerksList),
    c: (game) => {
      const playerFacing = game.player.facing;

      const adjacent = game.map.adjacentTile(game.player.tile, playerFacing);

      if (!adjacent) return;

      const door = adjacent.entities.find(isDoor);

      if (!door?.canClose) return;

      game.playerCloseDoor(door);
    },
    e: (game) => (game.metaUiState = MetaUiState.Inventory),
    x: (game) => {
      const playerTile = game.map.tileAt(game.player);

      const target = game.map.adjacentTile(playerTile, game.player.facing);

      if (!target) {
        return;
      }

      game.setSelectedTile(target);

      game.actionUiState = ActionUiState.Examining;
    },
    ...Array.from({ length: 10 })
      .map((_, idx) => idx)
      .reduce((acc, key) => {
        acc[key] = (game) => {
          const power = game.player.powerHotkeys[`${key}`];

          if (!power) return;

          game.player.selectedPower = power;

          if (power instanceof TargetedPower) {
            const playerTile = game.map.tileAt(game.player);

            const target = game.map.adjacentTile(
              playerTile,
              game.player.facing
            );

            if (!target) {
              return;
            }

            game.setSelectedTile(target);

            game.actionUiState = ActionUiState.AimingPower;
          } else if (power instanceof NonTargetedPower) {
            game.playerUsePower();
          }
        };

        return acc;
      }, {} as Record<string, KeyHandler>),
    '.': (game) => {
      game.playerWait();
    },
    d: (game) => game.toggleDirectionViewMode(),
    '>': (game) => {
      const playerTile = game.player.tile;

      if (playerTile.terrain instanceof ElevatorDown) {
        game.playerElevatorDown();
      }
    },
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
    r: (game) => game.playerReload(),
  },
  [ActionUiState.AimingPower]: {
    ArrowUp: (game) => updateAim(game, Dir.Up),
    ArrowRight: (game) => updateAim(game, Dir.Right),
    ArrowDown: (game) => updateAim(game, Dir.Down),
    ArrowLeft: (game) => updateAim(game, Dir.Left),
    Escape: (game) => {
      game.setSelectedTile(null);
      game.player.selectedPower = null;
      game.player.selectedPowerUsable = null;
      game.actionUiState = ActionUiState.Default;
    },
    f: (game) => {
      game.playerUsePower();
    },
    r: (game) => {
      game.rotateSelectedPowerAim();
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

function defaultArrowKey(game: Game, dir: Dir, shift = false) {
  const dirCoordOffset = {
    [Dir.Up]: { y: -1 },
    [Dir.Right]: { x: 1 },
    [Dir.Down]: { y: 1 },
    [Dir.Left]: { x: -1 },
  };

  const offset = dirCoordOffset[dir];

  if (game.player.facing === dir) {
    game.movePlayer(offset);
  } else if (shift) {
    game.playerStrafe(offset);
  } else {
    game.turnPlayer(dir);
  }
}
