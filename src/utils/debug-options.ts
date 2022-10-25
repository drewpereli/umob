const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 0,
  randomHalfWallsInEmptyMap: 0,
  randomLavaInEmptyMap: 0,
  docileEnemies: false,
  wanderingEnemies: false,
  extraEnemies: 0,
  infiniteHealth: true,
  infiniteEnergy: true,
  infiniteAccuracy: false,
  infiniteViewRange: true,
  fullViewAngle: true,
  showPlayerLastSeen: false,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
