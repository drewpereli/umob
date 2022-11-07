import { default as rand } from 'random';

export const random = {
  int: rand.int,
  float: rand.float,
  bool: rand.bool,
  arrayElement<T>(arr: T[] | readonly T[]): T {
    return arr[rand.int(0, arr.length - 1)];
  },
  arrayElements<T>(arr: T[], length: number): T[] {
    return this.shuffle(arr).slice(0, length);
  },
  shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => (rand.bool() ? -1 : 1));
  },
  polarity() {
    return rand.bool() ? 1 : -1;
  },
  weightedArrayElement<T>(arr: T[], weights: number[]): T {
    const weightsSum = weights.reduce((acc, v) => acc + v, 0);

    const randVal = this.float(0, weightsSum);

    let currSum = 0;

    for (const [i, val] of arr.entries()) {
      const weight = weights[i];
      currSum += weight;

      if (currSum > randVal) return val;
    }

    throw new Error('This function is broken');
  },
};
