import { useGame } from '@/stores/game';
import { useMap } from '@/stores/map';
import type { Tile } from '@/tile';
import { coordsEqual, distance } from '@/utils/map';
import { angle, angularDistance } from '@/utils/math';
import { isCreature } from '../creatures/creature';
import type { Damageable } from '../damageable';
import { isFlammable } from '../flammable';
import type MapEntity from '../map-entity';
import { Weapon } from './weapon';

export function weaponIsGun(w: Weapon): w is Gun {
  return w instanceof Gun;
}

export default abstract class Gun extends Weapon {
  penetration = 0;
  range = Infinity;
  spread: number | null = null;
  accuracyBonus = 0;
  abstract clipSize: number;
  abstract amoLoaded: number;
  reloadTimeMultiplier = 1;

  char = '¬';
  color = '#32CD32';

  attackActionMessageDescription = 'shot';
}

export class ShotGun extends Gun {
  name = 'shotgun';
  damage = 10;
  spread = 20;
  range = 10;
  attackTimeMultiplier = 4;
  clipSize = 4;
  amoLoaded = 4;
  description = "It's your basic shotgun. It shoots enemies in a cone.";
  accuracyBonus = -2;
}

export class Pistol extends Gun {
  name = 'pistol';
  damage = 5;
  range = 5;
  attackTimeMultiplier = 4;
  clipSize = 16;
  amoLoaded = 16;
  description = 'Not a lot of damage';
  accuracyBonus = 1;
}

export class AssaultRifle extends Gun {
  name = 'assault rifle';
  damage = 20;
  range = 20;
  penetration = 4;
  attackTimeMultiplier = 10;
  clipSize = 24;
  amoLoaded = 24;
  description = 'High damage and range. Can shoot through multiple enemies.';
  reloadTimeMultiplier = 2;
  accuracyBonus = 2;
}

export class SubMachineGun extends Gun {
  name = 'submachine gun';
  damage = 5;
  range = 10;
  penetration = 0;
  attackTimeMultiplier = 1;
  clipSize = 50;
  amoLoaded = 50;
  description = 'Low damage and range, but shoots really fast.';
  accuracyBonus = -1;
}

export class RailGun extends Gun {
  name = 'rail gun';
  damage = 5;
  range = 10;
  knockBack = 5;
  clipSize = 8;
  amoLoaded = 8;
  description =
    'Electromagnetic force to accelerate a metal slug to high speeds. Knocks back enemies.';
  reloadTimeMultiplier = 2;
}

export class Flamethrower extends Gun {
  name = 'flamethrower';
  damage = 5;
  range = 10;
  clipSize = 10;
  amoLoaded = 10;
  description = 'Shoot flames';
  spread = 30;
  onAttackTiles(tiles: Tile[]) {
    tiles.forEach((tile) => {
      tile.flammables.forEach((f) => {
        if (isCreature(f)) {
          f.startBurning();
        } else if (!f.isBurning) {
          f.startBurning();
        }
      });
    });
  }
}

export function tilesAimedAt(
  aimingFrom: Tile,
  aimingTo: Tile,
  weapon: Gun
): Tile[] {
  if (weapon.spread) {
    return tilesAimedAtSpread(
      aimingFrom,
      aimingTo,
      weapon.range,
      weapon.spread
    );
  }

  const game = useGame();
  const map = game.map;

  const tilesBetween = map.tilesBetween(aimingFrom, aimingTo).slice(1);

  const tiles: Tile[] = [];

  let penetrationRemaining = weapon.penetration;

  for (const tile of tilesBetween) {
    if (distance(aimingFrom, tile) > weapon.range) break;

    tiles.push(tile);

    const damageables = game.damageablesAt(tile);

    damageables.forEach((d) => {
      penetrationRemaining -= d.penetrationBlock;
    });

    if (penetrationRemaining < 0) break;
  }

  return tiles;
}

function tilesAimedAtSpread(
  aimingFrom: Tile,
  aimingTo: Tile,
  range: number,
  spread: number
): Tile[] {
  const map = useMap();

  const tilesInRadius = map
    .tilesInRadius(aimingFrom, range)
    .filter((tile) => !coordsEqual(tile, aimingFrom));

  const aimAngle = angle(aimingFrom, aimingTo);

  return tilesInRadius.filter((t) => {
    const tileAngle = angle(aimingFrom, t);
    const diff = angularDistance(aimAngle, tileAngle);

    return diff <= spread;
  });
}

export function damageablesAimedAt(
  aimingFrom: Tile,
  aimingTo: Tile,
  weapon: Gun
): (MapEntity & Damageable)[] {
  const tiles = tilesAimedAt(aimingFrom, aimingTo, weapon);

  const game = useGame();

  const damageables = tiles.flatMap((tile) => {
    return game.damageablesAt(tile);
  });

  if (weapon.spread) {
    return damageables;
  }

  return damageables.filter((d) => {
    return d.penetrationBlock || coordsEqual(d, aimingTo);
  });
}
