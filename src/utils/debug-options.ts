const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 10,
  randomLavaInEmptyMap: 10,
  docileEnemies: false,
  extraEnemies: 0,
  infiniteHealth: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
