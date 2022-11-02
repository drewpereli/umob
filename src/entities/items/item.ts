import { generateId } from '@/utils/id';
import type { AsciiDrawable } from '@/utils/types';

export abstract class Item implements AsciiDrawable {
  abstract name: string;
  abstract description: string;
  abstract char: string;
  abstract color: string;

  readonly id = generateId();
}
