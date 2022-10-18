import type { Covers } from '@/entities/actor';
import {
  Cover,
  coverMultiplierBetween,
  Dir,
  dirsBetween,
  coordsInViewCone,
} from '@/utils/map';
import { describe, expect, test } from 'vitest';

describe('dirsBetween', () => {
  const examples: [Coords, Coords, Dir[]][] = [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, [Dir.Right]],
    [{ x: 0, y: 0 }, { x: 0, y: 10 }, [Dir.Down]],
    [{ x: 0, y: 10 }, { x: 0, y: 0 }, [Dir.Up]],
    [{ x: 10, y: 0 }, { x: 0, y: 0 }, [Dir.Left]],
    [{ x: 0, y: 0 }, { x: 10, y: 3 }, [Dir.Right]],
    [{ x: 4, y: 8 }, { x: 1, y: 0 }, [Dir.Up]],
    [{ x: 0, y: 0 }, { x: 10, y: 10 }, [Dir.Right, Dir.Down]],
    [{ x: 0, y: 0 }, { x: 10, y: -10 }, [Dir.Up, Dir.Right]],
    [{ x: 0, y: 0 }, { x: -10, y: -10 }, [Dir.Left, Dir.Up]],
    [{ x: 0, y: 0 }, { x: -10, y: 10 }, [Dir.Down, Dir.Left]],
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
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, 1], // Right
    [{ x: 0, y: 10 }, { x: 0, y: 0 }, 1], // Up
    [{ x: 5, y: 10 }, { x: 1, y: 10 }, 0.5], // Left
    [{ x: 0, y: 5 }, { x: 5, y: 0 }, 1], // NE
    [{ x: 5, y: 5 }, { x: 0, y: 0 }, 0.5], // NW
    [{ x: 5, y: 0 }, { x: 0, y: 5 }, 0.5], // SW
  ];

  test.each(examples)(
    'coverMultiplierBetween(%o, %o, covers) -> %f',
    (target, source, expected) => {
      const actual = coverMultiplierBetween(target, source, covers);

      expect(actual).toBe(expected);
    }
  );
});

describe('coordsInViewCone', () => {
  const examples: [Coords, Coords, number, Dir, boolean][] = [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, 90, Dir.Right, true],
    [{ x: 0, y: 0 }, { x: 10, y: 10 }, 90, Dir.Right, true],
    [{ x: 0, y: 0 }, { x: 10, y: 11 }, 90, Dir.Right, false],
    [{ x: 5, y: 0 }, { x: 5, y: 10 }, 90, Dir.Down, true],
    [{ x: 5, y: 0 }, { x: 5, y: 10 }, 90, Dir.Right, false],
    [{ x: 5, y: 5 }, { x: 5, y: 6 }, 90, Dir.Down, true],
    [{ x: 5, y: 5 }, { x: 5, y: 6 }, 90, Dir.Up, false],
  ];

  test.each(examples)(
    'coordsInViewCone(%o, %o, %i, "%s") -> %j',
    (source, target, viewAngle, sourceFacing, expected) => {
      const actual = coordsInViewCone(source, target, viewAngle, sourceFacing);

      expect(actual).toBe(expected);
    }
  );
});
