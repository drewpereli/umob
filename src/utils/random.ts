import { default as rand } from 'random';

export const random = {
  int: rand.int,
  arrayElement<T>(arr: T[]): T {
    return arr[rand.int(0, arr.length - 1)];
  },
  arrayElements<T>(arr: T[], length: number): T[] {
    return this.shuffle(arr).slice(0, length);
  },
  shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => (rand.bool() ? -1 : 1));
  },
};
