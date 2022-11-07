const debugMode = false;

const activeOptions = {
  emptyMap: false,
  smallMap: false,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 0,
  randomLavaInEmptyMap: 0,
  docileEnemies: false,
  wanderingEnemies: false,
  extraEnemies: 0,
  noEnemies: false,
  noItems: true,
  infiniteHealth: true,
  infiniteEnergy: false,
  infiniteAccuracy: false,
  infiniteViewRange: true,
  fullViewAngle: true,
  showPlayerLastSeen: false,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
