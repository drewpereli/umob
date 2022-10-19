import { describe, expect, test, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGame } from '@/stores/game';
import { Tile, useMap } from '@/stores/map';
import Creature from '@/entities/creature';
import Gun from '@/entities/gun';
import { Floor, Wall, HalfWall } from '@/entities/terrain';

class TestGun extends Gun {
  name = 'test gun';
  damage = 0;
  accuracy = 1;
}

describe('Actor', () => {
  function createActor(coords: Coords) {
    const game = useGame();
    const map = useMap();

    const tile = map.tileAt(coords);

    const actor = new Creature(tile);
    actor.accuracyMultiplier = 1;
    actor.evasionMultiplier = 1;
    actor.equippedWeapon = new TestGun();

    game.actors.push(actor);

    return actor;
  }

  beforeEach(() => {
    setActivePinia(createPinia());

    const map = useMap();

    map.width = 10;
    map.height = 10;

    map.tiles = Array.from({ length: map.height }).map((_, y) => {
      return Array.from({ length: map.width }).map((_, x) => {
        return new Tile({ x, y, terrain: new Floor() });
      });
    });
  });

  describe('hitChanceForDamageable', () => {
    // describe('cover modifier', () => {
    // });

    test("when damageable isn't behind cover", () => {
      const source = createActor({ x: 1, y: 1 });
      const target = createActor({ x: 5, y: 5 });

      source.accuracyMultiplier = 0.75;
      source.equippedWeapon.accuracy = 0.33;
      target.evasionMultiplier = 0.5;

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(
        source.accuracyMultiplier *
          source.equippedWeapon.accuracy *
          target.evasionMultiplier
      );
    });

    test('when damageable is a wall', () => {
      const source = createActor({ x: 1, y: 1 });
      const target = useMap().tileAt({ x: 5, y: 5 });

      target.terrain = new Wall();

      source.accuracyMultiplier = 0.75;
      source.equippedWeapon.accuracy = 0.33;

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(1);
    });

    test('when damageable is a wall behind cover', () => {
      const source = createActor({ x: 1, y: 1 });
      const target = useMap().tileAt({ x: 5, y: 1 });

      target.terrain = new Wall();

      useMap().tileAt({ x: 4, y: 1 }).terrain = new HalfWall();

      source.accuracyMultiplier = 0.75;
      source.equippedWeapon.accuracy = 0.33;

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(1);
    });

    test('when damageable is an actor behind half cover', () => {
      const source = createActor({ x: 0, y: 0 });
      const target = createActor({ x: 5, y: 0 });

      useMap().tileAt({ x: 4, y: 0 }).terrain = new HalfWall();

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.75);
    });

    test('when damageable is an actor behind full cover', () => {
      const source = createActor({ x: 0, y: 0 });
      const target = createActor({ x: 5, y: 0 });

      useMap().tileAt({ x: 4, y: 0 }).terrain = new Wall();

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.5);
    });

    test('when damageable is an actor behind full cover and diagonal to shooter', () => {
      const source = createActor({ x: 0, y: 5 });
      const target = createActor({ x: 5, y: 0 });

      useMap().tileAt({ x: 4, y: 0 }).terrain = new Wall();

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.5);
    });
  });
});
