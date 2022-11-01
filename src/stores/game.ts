import Creature, {
  CreatureAlignment,
  isCreature,
} from '@/entities/creatures/creature';
import { isDamageable, type Damageable } from '@/entities/damageable';
import { Player } from '@/entities/player';
import { ActionUiState, MetaUiState } from '@/utils/action-handlers';
import { debugOptions } from '@/utils/debug-options';
import { angle, angularDistance } from '@/utils/math';
import { PermissiveFov } from 'permissive-fov';
import { defineStore } from 'pinia';
import { useAnimations } from './animations';
import { useMap } from './map';
import {
  coordsEqual,
  coordsInViewCone,
  rotateDir,
  type Dir,
} from '@/utils/map';
import { Wall } from '@/entities/terrain';
import { View } from '@/utils/view';
import { Actor } from '@/entities/actor';
import type MapEntity from '@/entities/map-entity';
import type { TargetedPower } from '@/powers/targeted-power';
import { Centrifuge } from '@/entities/centrifuge';
import { CreateTripWire } from '@/powers/create-trip-wire';
import type { Door } from '@/entities/terrain';
import {
  damageablesAimedAt,
  tilesAimedAt,
  weaponIsGun,
} from '@/entities/weapons/gun';
import { Rat } from '@/entities/creatures/rat';
import { canInteractWithFrom, isInteractable } from '@/entities/interactable';
import { removeElement } from '@/utils/array';
import { Tile } from '@/tile';

export const TURN = 4; // How many ticks make up a "turn"

export const useGame = defineStore('game', {
  state: () => ({
    player: null as unknown as Player,
    mapEntities: [] as MapEntity[],
    currTime: 0,
    map: useMap(),
    fovUtil: null as unknown as PermissiveFov,
    selectedTile: null as null | Tile,
    actionUiState: ActionUiState.Default,
    metaUiState: MetaUiState.Default,
    animations: useAnimations(),
    directionViewMode: false, // Actors chars will be replaced with arrows showing where they're facing
    view: new View(),
    // Sometimes there are actors that want to affect an entity, but only if the entity is
    // in a certain state at the beginning of the tick. i.e. Conveyor belts.
    // If a converyor belt moves the player directly in its "act" function, it might move the player
    // on to another conveyor belt, which might move the player onto another one, etc etc, until
    // we've moved the player all the way accross the map in one tick. With the system,
    // if the player is on a conveyor belt when it's "act" is called. It can add an action to the queue
    // that will move the player at the end of the tick. That way, no other conveyor belt will be able to act on the player that tick.
    endOfTickActionQueue: [] as Array<() => unknown>,
    nonPlayerActors: [] as Actor[], // Was originally computed, but there were performance issues, so this is sor tof a cache
    creaturesByAlignment: {
      [CreatureAlignment.WithPlayer]: [],
      [CreatureAlignment.AgainstPlayer]: [],
    } as Record<CreatureAlignment, Creature[]>,
    entitiesToCull: [] as MapEntity[],
    mapLevel: 1,
  }),
  getters: {
    allActors(state): Actor[] {
      return [state.player, ...this.nonPlayerActors];
    },
    enemies(): Creature[] {
      return this.creatures.filter(
        (e) => e.alignment === CreatureAlignment.AgainstPlayer
      );
    },
    creatures(state): Creature[] {
      return state.mapEntities.filter(isCreature);
    },
    entitiesAt() {
      return (coords: Coords): MapEntity[] => {
        const tile = this.map.tileAt(coords);
        return tile.entities;
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
        return this.entitiesAt(coords).find(
          (entity): entity is Creature => entity instanceof Creature
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

      const facing = this.player.facing;
      const dirsToTheSide = [rotateDir(facing, 1), rotateDir(facing, -1)];

      const tilesToTheSide = dirsToTheSide
        .map((dir) => this.map.adjacentTile(this.player.tile, dir))
        .filter((t): t is Tile => !!t);

      visibleTiles.push(...tilesToTheSide);

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
        return (this.player.selectedPower as TargetedPower).tilesAimedAt();
      }

      if (this.actionUiState !== ActionUiState.Aiming) return [];

      const weapon = this.player.equippedWeapon;

      if (!weapon || !weaponIsGun(weapon)) return [];

      return tilesAimedAt(this.player.tile, this.selectedTile, weapon);
    },
    damageablesAimedAt(): (Damageable & Coords)[] {
      if (this.actionUiState === ActionUiState.AimingPower) {
        return (
          (this.player.selectedPower as TargetedPower)?.damageablesAimedAt() ??
          []
        );
      }

      const weapon = this.player.equippedWeapon;

      if (!this.selectedTile || !weapon || !weaponIsGun(weapon)) return [];

      return damageablesAimedAt(this.player.tile, this.selectedTile, weapon);
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
        return tile.hasEntityThatBlocksMovement;
      };
    },
  },
  actions: {
    initialize() {
      this.map.generate();

      const fov = new PermissiveFov(
        this.map.width,
        this.map.height,
        (x: number, y: number) =>
          !this.map.tileAt({ x, y }).hasEntityThatBlocksView
      );

      this.fovUtil = fov;

      const tile = this.map.randomFloorTile();

      const player = new Player(tile);

      this.player = player;

      this.addPlayer(player, true);

      if (debugOptions.extraEnemies) {
        Array.from({ length: debugOptions.extraEnemies }).forEach(() => {
          let tile = this.map.randomFloorTile();

          while (!this.creatureCanOccupy(tile))
            tile = this.map.randomFloorTile();

          const enemy = new Rat(tile);
          this.addMapEntity(enemy);
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

      const interactableEntity = targetTile.entities.find(isInteractable);

      if (
        interactableEntity &&
        interactableEntity.isCurrentlyInteractable &&
        canInteractWithFrom(interactableEntity, this.player)
      ) {
        this.player.interact(interactableEntity);
      } else if (this.creatureCanOccupy(targetTile)) {
        this.player.move(targetTile);
      } else if (
        this.damageablesAt(targetTile) &&
        (!this.player.equippedWeapon ||
          !weaponIsGun(this.player.equippedWeapon))
      ) {
        this.player.attackTile(targetTile);
      } else {
        return;
      }

      this.enemies.forEach((actor) => actor.updateLastSawEnemy());

      this.view.draw();

      this._tickUntilPlayerCanAct();
    },
    turnPlayer(dir: Dir) {
      this.player.turn(dir);
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    playerFireWeapon() {
      this.player.attackTile(this.selectedTile as Tile);
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    playerUsePower() {
      if (this.player.useSelectedPower()) {
        this.view.draw();
        this._tickUntilPlayerCanAct();
      }
    },
    rotateSelectedPowerAim() {
      if (this.actionUiState !== ActionUiState.AimingPower) return;

      const power = this.player.selectedPower;

      if (!(power instanceof CreateTripWire)) return;

      power.rotateAim();

      this.view.draw();
    },
    playerReload() {
      this.player.reload();
      this.view.draw();
      this._tickUntilPlayerCanAct();
    },
    playerCloseDoor(door: Door) {
      this.player.closeDoor(door);
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
    playerElevatorDown() {
      this.mapEntities = [];
      this.endOfTickActionQueue = [];
      this.nonPlayerActors = [];
      this.entitiesToCull = [];
      this.creaturesByAlignment = {
        [CreatureAlignment.WithPlayer]: [],
        [CreatureAlignment.AgainstPlayer]: [],
      };

      this.selectedTile = null;

      this.map.generate();

      const tile = this.map.randomFloorTile();

      this.player.updatePosition(tile);

      this.addPlayer(this.player);

      this.mapLevel++;

      this.view.draw();
    },
    async _tickUntilPlayerCanAct() {
      this._cullEntities();

      this.view.draw();

      if (this.animations.animations.length) {
        await new Promise((res) => setTimeout(res, 0));
        await this.animations.runAnimations();
      }

      while (!this.player.canAct) {
        this._processOneTick();
        if (this.actionUiState === ActionUiState.GameOver) return;
      }

      this.view.draw();

      if (this.animations.animations.length) {
        await new Promise((res) => setTimeout(res, 0));
        await this.animations.runAnimations();
      }
    },
    _processOneTick() {
      this.nonPlayerActors.forEach((actor) => actor.actIfPossible());

      // this.mapEntities.forEach((entity) => {
      //   entity.tile.terrain.affectEntityOn?.(entity);
      // });

      this.endOfTickActionQueue.forEach((action) => action());
      this.endOfTickActionQueue = [];

      if (this.actionUiState === ActionUiState.GameOver) return;

      this._cullEntities();
      this._tickDownTime();
    },
    _tickDownTime() {
      this.allActors.forEach((actor) => actor.tick());
      this.currTime++;
    },
    _cullEntities() {
      this.entitiesToCull.forEach((entity) => {
        entity.tilesOccupied.forEach((t) => t.removeEntity(entity));

        if (entity instanceof Actor) {
          removeElement(this.nonPlayerActors, entity);

          if (isCreature(entity)) {
            removeElement(this.creaturesByAlignment[entity.alignment], entity);
          }
        }

        removeElement(this.mapEntities, entity);
      });

      this.entitiesToCull = [];
    },
    addPlayer(player: Player, setTilesOccupied = false) {
      if (setTilesOccupied) {
        player.tilesOccupied.forEach((tile) => tile.addEntity(player));
      }

      this.mapEntities.push(player);
      this.creaturesByAlignment[CreatureAlignment.WithPlayer].push(player);
    },
    addMapEntity(entity: MapEntity) {
      entity.tilesOccupied.forEach((tile) => tile.addEntity(entity));
      this.mapEntities.push(entity);

      if (entity instanceof Actor) {
        this.nonPlayerActors.push(entity);

        if (isCreature(entity)) {
          this.creaturesByAlignment[entity.alignment].push(entity);
        }
      }
    },
    addEndOfTickAction(action: () => unknown) {
      this.endOfTickActionQueue.push(action);
    },
    markEntityForRemoval(entity: MapEntity) {
      this.entitiesToCull.push(entity);
    },
  },
});
