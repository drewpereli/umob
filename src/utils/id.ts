export function generateId() {
  const rand1 = Math.round(Math.random() * 1e16);
  const rand2 = Math.round(Math.random() * 1e16);

  return `${rand1}${rand2}`;
}
