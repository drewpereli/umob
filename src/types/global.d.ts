export {};

declare global {
  interface Coords {
    x: number;
    y: number;
  }

  interface PolarCoords {
    t: number; // Angle
    r: number; // Radius
  }
}
