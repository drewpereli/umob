export interface AsciiDrawable {
  char: string;
  color: string;
  backgroundColor?: string;
}

export function isAsciiDrawable(item: unknown): item is AsciiDrawable {
  return (
    typeof (item as Record<string, unknown>).char === 'string' &&
    typeof (item as Record<string, unknown>).char === 'string'
  );
}
