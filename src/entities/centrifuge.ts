import { useGame } from '@/stores/game';
import bresenham from '@/utils/bresnham';
import { coordsEqual } from '@/utils/map';
import { angle, angularDifference, polarToCartesian } from '@/utils/math';
import { random } from '@/utils/random';
import { Actor } from './actor';
import Creature from './creature';
import { isDamageable } from './damageable';
import type MapEntity from './map-entity';

export class Centrifuge extends Actor {
  shouldRemoveFromGame = false;
  blocksMovement = true;
  canAct = true;

  currAngle = random.int(0, 359);

  length = 4.5;

  char = '+';

  angleChangePerTick = random.int(10, 45);

  damageWhenCantPush = 10;

  _act() {
    const game = useGame();

    // Any actors in the way will be pushed at this angle.
    // Almost perpendicular to where the centrifuge arm will be next tick,
    // but slightly angled outwards, so entities are pushed away from the centrifuge
    const pushAngle = this.currAngle + this.angleChangePerTick + 60;

    const sweptNextTick = this.coordsSweptNextTick;
    const occupiedNextTick = this.coordsOccupiedAtAngle(
      this.currAngle + this.angleChangePerTick
    );

    // For each tile that the centrifuge will sweep this turn, and for where it'll end up next turn,
    // if there are entities there, figure out where to move them.
    // If we can't find anywhere to move them, do damage
    [...sweptNextTick, ...occupiedNextTick].forEach((t) => {
      const entities = game
        .entitiesAt(t)
        .filter((e) => e.blocksMovement)
        .filter((e) => e !== this);

      entities.forEach((e) => {
        const moveTo = this.findNewSpotForEntityAfterPush(
          e,
          pushAngle,
          sweptNextTick,
          occupiedNextTick
        );

        if (moveTo) {
          e.updatePosition(moveTo);
        } else if (isDamageable(e)) {
          e.receiveDamage(this.damageWhenCantPush);
        }
      });
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
  }

  get occupies(): Coords[] {
    // return [...this.tilesOccupied, ...this.tilesSweptNextTick];
    return this.tilesOccupied;
  }

  get tilesOccupied(): Coords[] {
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
}
