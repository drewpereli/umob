const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 10,
  randomLavaInEmptyMap: 10,
  docileEnemies: false,
  extraEnemies: 1,
  infiniteHealth: 0,
  fullViewAngle: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
