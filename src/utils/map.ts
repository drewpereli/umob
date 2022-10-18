export enum Dir {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
}

export const DIRS = [Dir.Up, Dir.Right, Dir.Down, Dir.Left];

export function coordsEqual(c1: Coords, c2: Coords) {
  return c1.x === c2.x && c1.y === c2.y;
}

export function distance(c1: Coords, c2: Coords) {
  return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2);
}
