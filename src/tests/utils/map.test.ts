import type { Covers } from '@/entities/actor';
import { Cover, coverMultiplierBetween, Dir, dirsBetween } from '@/utils/map';
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

describe('coverMultiplierBetween', () => {
  const covers: Covers = {
    [Dir.Up]: Cover.None,
    [Dir.Right]: Cover.None,
    [Dir.Down]: Cover.Half,
    [Dir.Left]: Cover.Full,
  };

  const examples: [Coords, Coords, number][] = [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, 1],
    [{ x: 0, y: 10 }, { x: 0, y: 0 }, 0.75],
    [{ x: 5, y: 10 }, { x: 1, y: 10 }, 0.5],
    [{ x: 0, y: 5 }, { x: 5, y: 0 }, 0.75],
    [{ x: 5, y: 5 }, { x: 0, y: 0 }, 0.5],
    [{ x: 5, y: 0 }, { x: 0, y: 5 }, 0.5],
  ];

  test.each(examples)(
    'coverMultiplierBetween(%o, %o, covers) -> %f',
    (target, source, expected) => {
      const actual = coverMultiplierBetween(target, source, covers);

      expect(actual).toBe(expected);
    }
  );
});
