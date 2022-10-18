import { Dir, dirsBetween } from '@/utils/map';
import { describe, expect, test } from 'vitest';

describe('dirsBetween', () => {
  const examples: [Coords, Coords, Dir[]][] = [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, [Dir.Right]],
    [{ x: 0, y: 0 }, { x: 0, y: 10 }, [Dir.Up]],
    [{ x: 0, y: 10 }, { x: 0, y: 0 }, [Dir.Down]],
    [{ x: 10, y: 0 }, { x: 0, y: 0 }, [Dir.Left]],
    [{ x: 0, y: 0 }, { x: 10, y: 3 }, [Dir.Right]],
    [{ x: 4, y: 8 }, { x: 1, y: 0 }, [Dir.Down]],
    [{ x: 0, y: 0 }, { x: 10, y: 10 }, [Dir.Up, Dir.Right]],
    [{ x: 0, y: 0 }, { x: 10, y: -10 }, [Dir.Right, Dir.Down]],
    [{ x: 0, y: 0 }, { x: -10, y: -10 }, [Dir.Down, Dir.Left]],
    [{ x: 0, y: 0 }, { x: -10, y: 10 }, [Dir.Left, Dir.Up]],
  ];

  test.each(examples)('dirsBetween(%o, %o) -> %j', (a, b, expected) => {
    const actual = dirsBetween(a, b);
    expect(actual).toEqual(expected);
  });
});
