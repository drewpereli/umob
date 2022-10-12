const debugMode = true;

const activeOptions = {
  emptyMap: true,
  smallMap: true,
};

export const debugOptions = debugMode
  ? activeOptions
  : ({} as typeof activeOptions);
