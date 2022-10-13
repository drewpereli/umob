const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
  randomWallsInEmptyMap: 10,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
