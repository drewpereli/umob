export function slopeIntercept(
  c1: Coords,
  c2: Coords
): { m: number; b: number } {
  const m = (c2.y - c1.y) / (c2.x - c1.x);
  const b = c1.y - m * c1.x;

  return { m, b };
}

export function polarity(from: number, to: number): number {
  return to > from ? 1 : -1;
}
