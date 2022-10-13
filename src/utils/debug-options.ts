const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  docileEnemies: true,
  extraEnemies: 1,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
