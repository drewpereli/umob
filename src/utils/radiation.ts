export enum RadLevel {
  Negligible = 'negligible',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Extreme = 'extreme',
}

const RAD_LEVEL_MIN_VALUES: Record<RadLevel, number> = {
  [RadLevel.Negligible]: 0,
  [RadLevel.Low]: 50,
  [RadLevel.Medium]: 100,
  [RadLevel.High]: 200,
  [RadLevel.Extreme]: 400,
};

export function radLevelFromRads(rads: number): RadLevel {
  return (
    Object.values(RadLevel)
      .reverse()
      .find((level) => {
        const minVal = RAD_LEVEL_MIN_VALUES[level];

        if (rads >= minVal) {
          return level;
        }
      }) ?? RadLevel.Negligible
  );
}

export function atRadLevelOrHigher(rads: number, level: RadLevel) {
  return rads >= RAD_LEVEL_MIN_VALUES[level];
}
