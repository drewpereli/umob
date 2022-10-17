import Actor from '@/entities/actor';
import { Player } from '@/entities/player';
import { ActionUiState } from '@/utils/action-handlers';
import { debugOptions } from '@/utils/debug-options';
import { random } from '@/utils/random';
import { PermissiveFov } from 'permissive-fov';
import { defineStore } from 'pinia';
import { useAnimations } from './animations';
import {
  angle,
  angularDistance,
  coordsEqual,
  distance,
  Floor,
  Tile,
  useMap,
} from './map';
import { useMenu } from './menu';

export const useGame = defineStore('game', {
  state: () => ({
    actors: [] as Actor[],
    currTime: 0,
    map: useMap(),
    fovUtil: null as unknown as PermissiveFov,
    selectedTile: null as null | Tile,
    actionUiState: ActionUiState.Default,
    animations: useAnimations(),
    menu: useMenu(),
  }),
  getters: {
    player: (state) => state.actors[0],
    nonPlayerActors: (state) => state.actors.slice(1),
    actorAt() {
      return (coords: Coords) => {
        return this.actors.find(
          (actor) => actor.x === coords.x && actor.y === coords.y
        );
      };
    },
    visibleTiles() {
      const visibleTiles: Tile[] = [];

      this.fovUtil.compute(
        this.player.x,
        this.player.y,
        this.player.viewRange,
        (x: number, y: number) => {
          const tile = this.map.tileAt({ x, y });
          visibleTiles.push(tile);
        }
      );

      visibleTiles.forEach((tile) => tile.onPlayerSees());

      return visibleTiles;
    },
    tilesBetweenPlayerAndSelected(): Tile[] {
      const selectedTile = this.selectedTile;

      if (!selectedTile) return [];

      const playerTile = this.map.tileAt(this.player);

      return this.map.tilesBetween(playerTile, selectedTile).slice(1);
    },
    tilesAimedAt(): Tile[] {
      if (!this.selectedTile) return [];

      if (this.actionUiState === ActionUiState.AimingPower) {
        const coords = this.player.selectedPower?.tilesAimedAt();

        return coords?.map((coord) => this.map.tileAt(coord)) ?? [];
      }

      if (this.actionUiState !== ActionUiState.Aiming) return [];

      const weapon = this.player.equippedWeapon;

      let penetrationRemaining = weapon.penetration;

      const tiles: Tile[] = [];

      const spread = weapon.spread;

      if (spread) {
        const tilesInRadius = this.map
          .tilesInRadius(this.player, weapon.range)
          .filter((tile) => !coordsEqual(tile, this.player));

        const aimAngle = angle(this.player, this.selectedTile);

        return tilesInRadius.filter((t) => {
          const tileAngle = angle(this.player, t);
          const diff = angularDistance(aimAngle, tileAngle);

          return diff <= spread;
        });
      }

      const tilesBetween = this.tilesBetweenPlayerAndSelected;

      for (const tile of tilesBetween) {
        if (distance(this.player, tile) > this.player.equippedWeapon.range)
          break;

        tiles.push(tile);

        const actor = this.actorAt(tile);

        penetrationRemaining -= tile.terrain.penetrationBlock;

        if (actor) {
          penetrationRemaining -= actor.penetrationBlock;
        }

        if (penetrationRemaining < 0) break;
      }

      return tiles;
    },
    actorsAimedAt(): Actor[] {
      if (this.actionUiState === ActionUiState.AimingPower) {
        return this.player.selectedPower?.actorsAimedAt() ?? [];
      }

      return this.tilesAimedAt
        .map((tile) => this.actorAt(tile))
        .filter((t): t is Actor => !!t);
    },
    coordsVisible() {
      return (coords: Coords) => {
        return this.visibleTiles.some(
          (tile) => tile.x === coords.x && tile.y === coords.y
        );
      };
    },
  },
  actions: {
    initialize() {
      this.map.generate();

      const tile = this.map.randomFloorTile();

      const player = new Player(tile);

      const fov = new PermissiveFov(
        this.map.width,
        this.map.height,
        (x: number, y: number) => this.map.tileAt({ x, y }).isTransparent
      );

      this.fovUtil = fov;

      this.actors.push(player);

      if (debugOptions.extraEnemies) {
        Array.from({ length: debugOptions.extraEnemies }).forEach(() => {
          let tile = this.map.randomFloorTile();

          while (this.actorAt(tile)) tile = this.map.randomFloorTile();

          this.actors.push(new Actor(tile));
        });
      }
    },
    movePlayer({ x, y }: { x?: number; y?: number }) {
      const targetCoords: Coords = {
        x: this.player.x + (x ?? 0),
        y: this.player.y + (y ?? 0),
      };

      const targetTile = this.map.tileAt(targetCoords);

      if (!targetTile) return;

      if (!this.player.canMoveTo(targetTile)) return;

      this.player.move(targetTile);

      this._tickUntilPlayerCanAct();
    },
    playerFireWeapon() {
      this.player.fireWeapon(this.actorsAimedAt);
      this._tickUntilPlayerCanAct();
    },
    playerUsePower() {
      this.player.useSelectedPower();
      this._tickUntilPlayerCanAct();
    },
    onPlayerDie() {
      this.actionUiState = ActionUiState.GameOver;
    },
    async _tickUntilPlayerCanAct() {
      if (this.animations.animations.length) {
        await new Promise((res) => setTimeout(res, 0));
        await this.animations.runAnimations();
      }

      while (!this.player.canAct) {
        this.nonPlayerActors.forEach((actor) => actor.act());

        if (this.actionUiState === ActionUiState.GameOver) return;

        this._cullDeadActors();
        this._tick();
      }
    },
    _tick() {
      this.actors.forEach((actor) => actor.tick());
      this.currTime++;
    },
    _cullDeadActors() {
      this.actors = this.actors.filter((actor) => !actor.isDead);
    },
  },
});
