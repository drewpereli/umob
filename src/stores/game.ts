import Creature from '@/entities/creature';
import { isDamageable, type Damageable } from '@/entities/damageable';
import { Player } from '@/entities/player';
import { ActionUiState } from '@/utils/action-handlers';
import { debugOptions } from '@/utils/debug-options';
import { angle, angularDistance } from '@/utils/math';
import { PermissiveFov } from 'permissive-fov';
import { defineStore } from 'pinia';
import { useAnimations } from './animations';
import { Tile, useMap } from './map';
import { useMenu } from './menu';
import { distance, coordsEqual, coordsInViewCone, Dir } from '@/utils/map';
import { Wall } from '@/entities/terrain';
import { View } from '@/utils/view';
import { Enemy } from '@/entities/enemy';
import { Actor } from '@/entities/actor';
import type MapEntity from '@/entities/map-entity';

export const useGame = defineStore('game', {
  state: () => ({
    player: null as unknown as Player,
    mapEntities: [] as MapEntity[],
    currTime: 0,
    map: useMap(),
    fovUtil: null as unknown as PermissiveFov,
    selectedTile: null as null | Tile,
    actionUiState: ActionUiState.Default,
    animations: useAnimations(),
    menu: useMenu(),
    directionViewMode: false, // Actors chars will be replaced with arrows showing where they're facing
    view: new View(),
  }),
  getters: {
    allActors(state): Actor[] {
      return [state.player, ...this.nonPlayerActors];
    },
    nonPlayerActors(state): Actor[] {
      return state.mapEntities.filter((entity): entity is Actor => {
        return entity instanceof Actor && !(entity instanceof Player);
      });
    },
    enemies(state): Enemy[] {
      return state.mapEntities.filter(
        (entity): entity is Enemy => entity instanceof Enemy
      );
    },
    creatures(state): Creature[] {
      return state.mapEntities.filter(
        (entity): entity is Creature => entity instanceof Creature
      );
    },
    entitiesAt() {
      return (coords: Coords): MapEntity[] => {
        return this.mapEntities.filter((entity) => coordsEqual(coords, entity));
      };
    },
    damageablesAt() {
      return (coords: Coords): (MapEntity & Damageable)[] => {
        return this.entitiesAt(coords).filter(
          (e): e is MapEntity & Damageable => isDamageable(e)
        );
      };
    },
    creatureAt() {
      return (coords: Coords) => {
        return this.creatures.find((entity) => coordsEqual(coords, entity));
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

          if (
            !coordsInViewCone(
              this.player,
              tile,
              this.player.viewAngle,
              this.player.facing
            ) &&
            !coordsEqual(tile, this.player)
          )
            return;

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

        const damageables = this.damageablesAt(tile);

        penetrationRemaining -= tile.terrain.penetrationBlock;

        damageables.forEach((d) => {
          penetrationRemaining -= d.penetrationBlock;
        });

        if (penetrationRemaining < 0) break;
      }

      return tiles;
    },
    damageablesAimedAt(): (Damageable & Coords)[] {
      if (this.actionUiState === ActionUiState.AimingPower) {
        return this.player.selectedPower?.actorsAimedAt() ?? [];
      }

      return this.tilesAimedAt.flatMap((tile): (Damageable & Coords)[] => {
        const damageables = this.damageablesAt(tile);

        if (damageables.length) return damageables;

        if (tile.terrain instanceof Wall) return [tile];

        return [];
      });
    },
    coordsVisible() {
      return (coords: Coords) => {
        return this.visibleTiles.some(
          (tile) => tile.x === coords.x && tile.y === coords.y
        );
      };
    },
    creatureCanOccupy() {
      return (coords: Coords) => {
        return !this.coordsBlocksMovement(coords);
      };
    },
    coordsBlocksMovement() {
      return (coords: Coords) => {
        const tile = coords instanceof Tile ? coords : this.map.tileAt(coords);
        if (tile.terrain.blocksMovement) return true;
        if (this.entitiesAt(tile).some((e) => e.blocksMovement)) return true;
        return false;
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
        (x: number, y: number) => !this.map.tileAt({ x, y }).blocksView
      );

      this.fovUtil = fov;

      this.player = player;
      this.mapEntities.push(player);

      if (debugOptions.extraEnemies) {
        Array.from({ length: debugOptions.extraEnemies }).forEach(() => {
          let tile = this.map.randomFloorTile();

          while (!this.creatureCanOccupy(tile))
            tile = this.map.randomFloorTile();

          const enemy = new Enemy(tile);
          this.mapEntities.push(enemy);
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

      if (!this.creatureCanOccupy(targetTile)) return;

      this.player.move(targetTile);

      this.enemies.forEach((actor) => actor.updateLastSawPlayerIfCanSee());

      this.view.draw();

      this._tickUntilPlayerCanAct();
    },
    turnPlayer(dir: Dir) {
      this.player.turn(dir);
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    playerFireWeapon() {
      this.player.fireWeapon(this.damageablesAimedAt);
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    playerUsePower() {
      if (this.player.useSelectedPower()) {
        this.view.draw();
        this._tickUntilPlayerCanAct();
      }
    },
    playerReload() {
      this.player.reload();
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    async setSelectedTile(tile: Tile | null) {
      if (tile && !this.coordsVisible(tile)) return;

      this.selectedTile = tile;

      await new Promise((res) => setTimeout(res, 0));

      this.view.draw();
    },
    onPlayerDie() {
      this.actionUiState = ActionUiState.GameOver;
    },
    toggleDirectionViewMode() {
      this.directionViewMode = !this.directionViewMode;
      this.view.draw();
    },
    async playerWait() {
      this.player.wait();
      this._tickUntilPlayerCanAct();
    },
    async _tickUntilPlayerCanAct() {
      if (this.animations.animations.length) {
        await new Promise((res) => setTimeout(res, 0));
        await this.animations.runAnimations();
      }

      while (!this.player.canAct) {
        this._processOneTick();
      }

      this.view.draw();

      if (this.animations.animations.length) {
        await new Promise((res) => setTimeout(res, 0));
        await this.animations.runAnimations();
      }
    },
    _processOneTick() {
      this.nonPlayerActors.forEach((actor) => actor.actIfPossible());

      this.creatures.forEach((actor) => {
        const tile = this.map.tileAt(actor);
        tile.terrain.affectActorStandingOn?.(actor);
      });

      if (this.actionUiState === ActionUiState.GameOver) return;

      this._cullEntities();
      this._tickDownTime();
    },
    _tickDownTime() {
      this.allActors.forEach((actor) => actor.tick());
      this.currTime++;
    },
    _cullEntities() {
      this.mapEntities = this.mapEntities.filter(
        (entity) => !entity.shouldRemoveFromGame
      );
    },
    addMapEntity(entity: MapEntity) {
      this.mapEntities.push(entity);
    },
  },
});
