const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  docileEnemies: false,
  extraEnemies: 10,
  infiniteHealth: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
