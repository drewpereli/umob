import type { Covers } from '@/entities/actor';
import { angle } from './math';

export enum Dir {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
}

export const DIRS = [Dir.Up, Dir.Right, Dir.Down, Dir.Left];

export enum Cover {
  None = 'none',
  Half = 'half',
  Full = 'full',
}

const coverEvasionMultipliers: Record<Cover, number> = {
  [Cover.None]: 1,
  [Cover.Half]: 0.75,
  [Cover.Full]: 0.5,
};

export function coordsEqual(c1: Coords, c2: Coords) {
  return c1.x === c2.x && c1.y === c2.y;
}

export function distance(c1: Coords, c2: Coords) {
  return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2);
}

// Returns the direction(s) between "from" and "to"
// This is usually just one direction, but if "from" and "to" are at exactly a 45 degree angle, it will return 2 directions
// e.g. if "to" is exactly north-east of "from", it will return [Dir.Up, Dir.Right]
export function dirsBetween(from: Coords, to: Coords): [Dir] | [Dir, Dir] {
  const angleBetween = angle(from, to);

  switch (angleBetween) {
    case 45:
      return [Dir.Up, Dir.Right];
    case 135:
      return [Dir.Left, Dir.Up];
    case -45:
      return [Dir.Right, Dir.Down];
    case -135:
      return [Dir.Down, Dir.Left];
  }

  if (isBetween(angleBetween, -45, 45)) return [Dir.Right];
  if (isBetween(angleBetween, 45, 135)) return [Dir.Up];
  if (isBetween(angleBetween, -135, -45)) return [Dir.Down];
  return [Dir.Left];
}

// num is within [min, max)
function isBetween(num: number, min: number, max: number) {
  return num >= min && num < max;
}

export function coverMultiplierBetween(
  target: Coords,
  source: Coords,
  targetCovers: Covers
) {
  const directions = dirsBetween(target, source);

  const covers = directions.map((dir) => targetCovers[dir]);

  const multipliers = covers.map((cover) => coverEvasionMultipliers[cover]);

  return Math.min(...multipliers);
}
