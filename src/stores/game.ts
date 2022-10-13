import Actor from '@/entities/actor';
import { Player } from '@/entities/player';
import { ActionUiState } from '@/utils/action-handlers';
import { PermissiveFov } from 'permissive-fov';
import { defineStore } from 'pinia';
import random from 'random';
import { Floor, Tile, useMap } from './map';

export const useGame = defineStore('game', {
  state: () => ({
    actors: [] as Actor[],
    currTime: 0,
    map: useMap(),
    fovUtil: null as unknown as PermissiveFov,
    selectedTile: null,
    actionUiState: ActionUiState.Default,
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
        10,
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
      if (this.actionUiState !== ActionUiState.Aiming) return [];

      let penetrationRemaining = this.player.equippedWeapon.penetration;

      const tiles: Tile[] = [];

      const tilesBetween = this.tilesBetweenPlayerAndSelected;

      for (const tile of tilesBetween) {
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
      return this.tilesAimedAt
        .map((tile) => this.actorAt(tile))
        .filter((t): t is Actor => !!t);
    },
  },
  actions: {
    initialize() {
      this.map.generate();

      // Get random floor tile for player
      const floorTiles = this.map.tiles
        .flat()
        .filter((tile) => tile.terrain instanceof Floor);

      const idx = random.int(0, floorTiles.length - 1);
      const tile = floorTiles[idx];

      const player = new Player(tile);

      const fov = new PermissiveFov(
        this.map.width,
        this.map.height,
        (x: number, y: number) => this.map.tileAt({ x, y }).isTransparent
      );

      this.fovUtil = fov;

      this.actors.push(player);
      this.actors.push(new Actor({ x: 10, y: 10 }));
    },
    movePlayer({ x, y }: { x?: number; y?: number }) {
      const targetCoords: Coords = {
        x: this.player.x + (x ?? 0),
        y: this.player.y + (y ?? 0),
      };

      if (this.actorAt(targetCoords)) return;

      const targetTile = this.map.tileAt(targetCoords);

      if (!targetTile) return;

      if (!targetTile.canMoveTo) return;

      this.player.move(targetTile);

      this._tickUntilPlayerCanAct();
    },
    playerFireWeapon() {
      this.player.fireWeapon(this.actorsAimedAt);
      this._tickUntilPlayerCanAct();
    },
    _tickUntilPlayerCanAct() {
      while (!this.player.canAct) {
        this.nonPlayerActors.forEach((actor) => actor.act());
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
