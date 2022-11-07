export function removeElement<T>(arr: T[], element: T) {
  const idx = arr.indexOf(element);
  arr.splice(idx, 1);
}

// More efficient than removeElement, but doesn't remove order
export function removeElementNoPreserveOrder<T>(arr: T[], element: T) {
  const idx = arr.indexOf(element);
  arr[idx] = arr[arr.length - 1];
  arr.pop();
}

export function minBy<T>(arr: T[], by: (item: T) => number): T {
  let minValue = Infinity;
  let minEl: T = arr[0];

  for (const item of arr) {
    const val = by(item);

    if (val < minValue) {
      minValue = val;
      minEl = item;
    }
  }

  return minEl;
}

export function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

export function groupBy<T>(arr: T[], prop: keyof T): T[][] {
  const map = new Map(Array.from(arr, (obj) => [obj[prop], []]));
  arr.forEach((obj) => (map.get(obj[prop]) as T[]).push(obj));
  return Array.from(map.values());
}
