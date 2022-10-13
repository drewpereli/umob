const debugMode = false;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  docileEnemies: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
