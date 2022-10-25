import { isDoor } from '@/entities/door';
import type Gun from '@/entities/weapons/gun';
import type { Item } from '@/entities/items/item';
import { NonTargetedPower } from '@/powers/non-targeted-power';
import type { Power } from '@/powers/power';
import { TargetedPower } from '@/powers/targeted-power';
import type { useGame } from '@/stores/game';
import { Dir } from './map';

export enum ActionUiState {
  Default = 'default',
  Aiming = 'aiming',
  GameOver = 'game-over',
  Inventory = 'inventory',
  AimingPower = 'aiming-power',
  Examining = 'examining',
  PowersList = 'powers-list',
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
    r: (game) => game.playerReload(),
    e: (game) => (game.actionUiState = ActionUiState.Inventory),
    p: (game) => (game.actionUiState = ActionUiState.PowersList),
    c: (game) => {
      const playerFacing = game.player.facing;

      const adjacent = game.map.adjacentTile(game.player.tile, playerFacing);

      if (!adjacent) return;

      const door = adjacent.entities.find(isDoor);

      if (!door?.canClose) return;

      game.playerCloseDoor(door);
    },
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
      game.actionUiState = ActionUiState.Default;
    },
    f: (game) => {
      game.playerUsePower();
    },
    r: (game) => {
      game.rotateSelectedPowerAim();
    },
  },
  [ActionUiState.Inventory]: {
    Escape: (game) => (game.actionUiState = ActionUiState.Default),
    ArrowUp: (game) => game.menu.previousItem(),
    ArrowDown: (game) => game.menu.nextItem(),
    d: (game) => {
      const item = game.menu.selectedItem.model as Item;
      game.player.dropItem(item);
    },
    Enter: (game) => {
      const weapon = game.menu.selectedItem.model as Gun;
      game.player.equippedWeapon = weapon;
      game.actionUiState = ActionUiState.Default;
    },
  },
  [ActionUiState.PowersList]: {
    Escape: (game) => (game.actionUiState = ActionUiState.Default),
    ArrowUp: (game) => game.menu.previousItem(),
    ArrowDown: (game) => game.menu.nextItem(),
    ...Array.from({ length: 10 })
      .map((_, idx) => idx)
      .reduce((acc, key) => {
        acc[key] = (game) => {
          const powerHotkeys = game.player.powerHotkeys;

          const selectedPower = game.menu.selectedItem.model as Power;

          const currentHotKeyForPower = Object.keys(powerHotkeys).find(
            (hotKey) => powerHotkeys[hotKey] === selectedPower
          );

          powerHotkeys[`${key}`] = selectedPower;

          if (currentHotKeyForPower) {
            delete powerHotkeys[currentHotKeyForPower];
          }

          game.player.powerHotkeys = { ...powerHotkeys };
        };

        return acc;
      }, {} as Record<string, KeyHandler>),
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
