const debugMode = true;

const activeOptions = {
  emptyMap: false,
  smallMap: false,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 0,
  randomLavaInEmptyMap: 0,
  docileEnemies: false,
  wanderingEnemies: false,
  extraEnemies: 0,
  infiniteHealth: false,
  infiniteEnergy: false,
  infiniteAccuracy: false,
  infiniteViewRange: false,
  fullViewAngle: false,
  showPlayerLastSeen: false,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
