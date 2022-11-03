export function tap<T>(item: T, fn: (el: T) => unknown): T {
  fn(item);
  return item;
}
