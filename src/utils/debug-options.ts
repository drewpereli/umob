const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 0,
  randomLavaInEmptyMap: 0,
  docileEnemies: true,
  extraEnemies: 10,
  infiniteHealth: true,
  infiniteAccuracy: true,
  fullViewAngle: false,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
