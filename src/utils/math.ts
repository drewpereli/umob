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

// Returns between -180 and 180
export function angle(c1: Coords, c2: Coords) {
  return Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI);
}

export function angularDistance(sourceA: number, targetA: number) {
  return Math.abs(((((targetA - sourceA + 180) % 360) + 360) % 360) - 180);
}
