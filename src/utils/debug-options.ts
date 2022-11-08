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
  noEnemies: true,
  noItems: true,
  infiniteHealth: true,
  infiniteEnergy: false,
  infiniteAccuracy: false,
  infiniteViewRange: true,
  fullViewAngle: true,
  showPlayerLastSeen: false,
  roomWhenEmptyMap: 'AutoRadSpitterRoom',
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
