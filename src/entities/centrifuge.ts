import { TURN, useGame } from '@/stores/game';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import bresenham from '@/utils/bresenham';
import { coordsEqual } from '@/utils/map';
import { angle, angularDifference, polarToCartesian } from '@/utils/math';
import { random } from '@/utils/random';
import type { AsciiDrawable } from '@/utils/types';
import { Actor } from './actor';
import { isDamageable } from './damageable';
import type MapEntity from './map-entity';
import { EntityLayer } from './map-entity';
import { DamageType } from './weapons/weapon';

export class Centrifuge extends Actor implements AsciiDrawable {
  constructor(tile: Tile, public isOn = true, public length = 4.5) {
    super(tile);

    if (isOn) {
      this.angleChangePerTick = this.maxAngleChangePerTick;
    } else {
      this.angleChangePerTick = 0;
    }

    this.initializeTilesOccupied();
  }

  layer = EntityLayer.Object;

  tilesOccupied: Tile[] = [];

  shouldRemoveFromGame = false;
  blocksMovement = true;
  blocksView = false;
  canAct = true;

  currAngle = random.int(0, 359);

  char = '+';
  color = '#eee';

  maxAngleChangePerTick = random.int(10, 45) / TURN;
  angleChangePerTick;

  damageWhenCantPush = 10;

  mass = 10000;

  maxPushableMass = 1000;

  _act() {
    if (this.isOn) {
      this.angleChangePerTick = Math.min(
        this.maxAngleChangePerTick,
        this.angleChangePerTick + 0.5
      );
    } else {
      this.angleChangePerTick = Math.max(0, this.angleChangePerTick - 0.5);
    }

    if (this.angleChangePerTick === 0) return;

    const game = useGame();

    // Any actors in the way will be pushed at this angle.
    // Almost perpendicular to where the centrifuge arm will be next tick,
    // but slightly angled outwards, so entities are pushed away from the centrifuge
    const pushAngle = this.currAngle + this.angleChangePerTick + 60;

    const sweptNextTick = this.coordsSweptNextTick;
    const occupiedNextTick = this.coordsOccupiedAtAngle(
      this.currAngle + this.angleChangePerTick
    );

    // For each entity that will be swept by the centrifuge, figure out where to move them.
    // If we can't find anywhere to move them, do damage
    const entitiesToMove = [...sweptNextTick, ...occupiedNextTick].flatMap(
      (t) => {
        return game
          .entitiesAt(t)
          .filter((e) => e.blocksMovement)
          .filter((e) => e !== this);
      }
    );

    const totalMass = entitiesToMove.reduce(
      (mass, entity) => mass + entity.mass,
      0
    );

    if (totalMass > this.maxPushableMass) return;

    entitiesToMove.forEach((e) => {
      const moveTo = this.findNewSpotForEntityAfterPush(
        e,
        pushAngle,
        sweptNextTick,
        occupiedNextTick
      );

      if (moveTo) {
        const tile = game.map.tileAt(moveTo);
        e.updatePosition(tile);
      } else if (isDamageable(e)) {
        e.receiveDamage(this.damageWhenCantPush, DamageType.Physical);
      }
    });

    this.rotate(this.angleChangePerTick);
  }

  findNewSpotForEntityAfterPush(
    e: MapEntity,
    pushAngle: number,
    sweptNextTick: Coords[],
    occupiedNextTick: Coords[]
  ): Coords | undefined {
    const game = useGame();

    // push the entity at pushAngle until it is
    // not within tilesSweptNextTick
    // not within coordsOccupiedAt(this.currAngle + this.angleChangePerTick)
    // Not occupied by another entity
    let lastCheckedPolar: PolarCoords = { t: pushAngle, r: 0 };

    // This is really a while loop. We're just using a for loop to make sure we don't
    // get caught in an infinite loop
    for (let i = 0; i < 100; i++) {
      const checkPolar: PolarCoords = {
        t: pushAngle,
        r: lastCheckedPolar.r + 1,
      };

      lastCheckedPolar = checkPolar;

      const checkRelToEntity = polarToCartesian(checkPolar);
      const check: Coords = {
        x: Math.round(e.x + checkRelToEntity.x),
        y: Math.round(e.y + checkRelToEntity.y),
      };

      // If coords in tileSweptNextTick, continue
      if (sweptNextTick.some((c) => coordsEqual(c, check))) {
        continue;
      }

      // If coords in tiles that will be occupied next tick
      if (occupiedNextTick.some((c) => coordsEqual(c, check))) {
        continue;
      }

      if (!game.map.coordsInBounds(check)) return;

      if (!game.creatureCanOccupy(check)) {
        continue;
      }

      return check;
    }
  }

  rotate(degrees: number) {
    this.currAngle = (this.currAngle + degrees) % 360;
    this.updateTilesOccupied();
  }

  get coordsOccupied(): Coords[] {
    return this.coordsOccupiedAtAngle(this.currAngle);
  }

  get coordsSweptNextTick(): Coords[] {
    const game = useGame();

    const tilesInRadius = game.map.tilesInRadius(this, this.length);

    const tilesInRadiusSweptThisTick = tilesInRadius.filter((t) => {
      const tAngle = angle(this, t);
      const dist = angularDifference(this.currAngle, tAngle);
      return dist <= this.angleChangePerTick && dist >= 0;
    });

    return tilesInRadiusSweptThisTick;
  }

  coordsOccupiedAtAngle(angle: number) {
    angle = angle % 360;

    const polar: PolarCoords = {
      t: angle,
      r: this.length,
    };

    const currTipRelativeToCenter = polarToCartesian(polar);

    const currTip = {
      x: currTipRelativeToCenter.x + this.x,
      y: currTipRelativeToCenter.y + this.y,
    };

    return bresenham(this, currTip);
  }

  updateTilesOccupied() {
    const map = useMap();
    this.tilesOccupied.forEach((t) => t.removeEntity(this));
    this.tilesOccupied = this.coordsOccupied.map((coords) =>
      map.tileAt(coords)
    );
    this.tilesOccupied.forEach((t) => t.addEntity(this));
  }

  initializeTilesOccupied() {
    const map = useMap();
    this.tilesOccupied = this.coordsOccupied.map((coords) =>
      map.tileAt(coords)
    );
  }

  toggleOnOff() {
    this.isOn = !this.isOn;
  }

  turnOff() {
    this.isOn = false;
  }
}
