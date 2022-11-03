export interface AsciiDrawable {
  char: string;
  color: string;
  backgroundColor?: string;
  rotateChar?: number;
}

export function isAsciiDrawable(item: unknown): item is AsciiDrawable {
  return (
    typeof (item as Record<string, unknown>).char === 'string' &&
    typeof (item as Record<string, unknown>).char === 'string'
  );
}

export interface Upgradeable {
  currentUpgradeLevel: number;
  maxUpgradeLevel: number;
  canUpgrade: boolean;
  upgrade: () => unknown;
  levelDescriptions: string[];
}

export function upgradeWithLevel<T = unknown>(values: T[]): PropertyDecorator {
  return function (): TypedPropertyDescriptor<T> {
    return {
      get(this: Upgradeable) {
        return values[this.currentUpgradeLevel - 1];
      },
    };
  };
}
