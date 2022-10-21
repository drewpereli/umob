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
  return Math.abs(angularDifference(sourceA, targetA));
}

export function angularDifference(sourceA: number, targetA: number) {
  return ((((targetA - sourceA + 180) % 360) + 360) % 360) - 180;
}

export function cartesianToPolar(coords: Coords): PolarCoords {
  const t = (Math.atan2(coords.y, coords.x) * 180) / Math.PI;
  const r = Math.sqrt(coords.x ** 2 + coords.y ** 2);

  return { t, r };
}

export function polarToCartesian(coords: PolarCoords): Coords {
  const x = round(coords.r * Math.cos((coords.t * Math.PI) / 180), 4);
  const y = round(coords.r * Math.sin((coords.t * Math.PI) / 180), 4);

  return { x, y };
}

export function round(number: number, places = 0) {
  const mult = 10 ** places;

  return Math.round(number * mult) / mult;
}
