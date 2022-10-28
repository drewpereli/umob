export function removeElement<T>(arr: T[], element: T) {
  const idx = arr.indexOf(element);
  arr.splice(idx, 1);
}
