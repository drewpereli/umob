import type { Covers } from '@/entities/creatures/creature';
import { angle, angularDistance } from './math';

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

export enum FlankingDir {
  Front = 'front',
  Side = 'side',
  Back = 'back',
}

const dirAngleOffsets = {
  [Dir.Up]: -90,
  [Dir.Right]: 0,
  [Dir.Down]: 90,
  [Dir.Left]: 180,
};

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
// It's kind of confusing because the y-axis is inverted (0 is at the top)
export function dirsBetween(from: Coords, to: Coords): [Dir] | [Dir, Dir] {
  const angleBetween = angle(from, to);

  switch (angleBetween) {
    case 45:
      return [Dir.Right, Dir.Down];
    case 135:
      return [Dir.Down, Dir.Left];
    case -45:
      return [Dir.Up, Dir.Right];
    case -135:
      return [Dir.Left, Dir.Up];
  }

  if (isBetween(angleBetween, -45, 45)) return [Dir.Right];
  if (isBetween(angleBetween, 45, 135)) return [Dir.Down];
  if (isBetween(angleBetween, -135, -45)) return [Dir.Up];
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

// This DOES NOT compute the actors fov
// It just checks if the coords are within the actor's view cone, ignoring view range, walls, etc
export function coordsInViewCone(
  source: Coords,
  target: Coords,
  viewAngle: number,
  sourceFacing: Dir
) {
  const angleCurrentlyFacing = angleFromDir(sourceFacing);

  const targetAngle = angle(source, target);

  const distance = angularDistance(angleCurrentlyFacing, targetAngle);

  return distance <= viewAngle / 2;
}

// Rotates "dir" "steps" number of 90-degree steps clockwise
// Set "steps" to negative to rotate counter-clockwise
export function rotateDir(dir: Dir, steps: number): Dir {
  const actualSteps = Math.floor(steps % 4);
  const clockwiseSteps = actualSteps < 0 ? actualSteps + 4 : actualSteps;

  const dirIdx = DIRS.indexOf(dir);
  const newIdx = (dirIdx + clockwiseSteps) % 4;

  return DIRS[newIdx];
}

export function flankingDirBetween(
  source: Coords,
  target: Coords,
  targetFacing: Dir
): FlankingDir {
  const dirs = dirsBetween(source, target);

  if (dirs.includes(targetFacing)) return FlankingDir.Back;

  if (
    dirs.includes(rotateDir(targetFacing, 1)) ||
    dirs.includes(rotateDir(targetFacing, -1))
  )
    return FlankingDir.Side;

  return FlankingDir.Front;
}

export function angleFromDir(dir: Dir): number {
  return dirAngleOffsets[dir];
}

export function addCoords(c1: Coords, c2: Partial<Coords>): Coords {
  return {
    x: c1.x + (c2?.x ?? 0),
    y: c1.y + (c2?.y ?? 0),
  };
}
