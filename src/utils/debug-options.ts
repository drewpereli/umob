const debugMode = true;

const activeOptions = {
  emptyMap: false,
  smallMap: false,
  randomWallsInEmptyMap: 0,
  docileEnemies: false,
  extraEnemies: 40,
  infiniteHealth: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
