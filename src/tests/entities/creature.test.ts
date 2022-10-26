import { describe, expect, test, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGame } from '@/stores/game';
import { Tile, useMap } from '@/stores/map';
import Creature from '@/entities/creatures/creature';
import Gun from '@/entities/weapons/gun';
import { Wall, HalfWall } from '@/entities/terrain';

class TestGun extends Gun {
  name = 'test gun';
  damage = 0;
  accuracy = 1;
  description = '';
  clipSize = 10;
  amoLoaded = 10;
}

class TestCreature extends Creature {
  _act() {}

  mass = 100;

  blocksView = false;

  defaultChar = '';
  color = 'white';
  name = 'test creature';
}

describe('Actor', () => {
  function createActor(coords: Coords) {
    const game = useGame();
    const map = useMap();

    const tile = map.tileAt(coords);

    const actor = new TestCreature(tile);
    actor.accuracyMultiplier = 1;
    actor.evasionMultiplier = 1;
    actor.equippedWeapon = new TestGun();

    game.mapEntities.push(actor);

    return actor;
  }

  beforeEach(() => {
    setActivePinia(createPinia());

    const map = useMap();

    map.width = 10;
    map.height = 10;

    map.tiles = Array.from({ length: map.height }).map((_, y) => {
      return Array.from({ length: map.width }).map((_, x) => {
        return new Tile({ x, y });
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
      (source.equippedWeapon as Gun).accuracy = 0.33;
      target.evasionMultiplier = 0.5;

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(
        source.accuracyMultiplier *
          (source.equippedWeapon as Gun).accuracy *
          target.evasionMultiplier
      );
    });

    test('when damageable is a wall', () => {
      const source = createActor({ x: 1, y: 1 });
      const target = useMap().tileAt({ x: 5, y: 5 });

      const wall = new Wall(target);

      useGame().addMapEntity(wall);

      source.accuracyMultiplier = 0.75;
      (source.equippedWeapon as Gun).accuracy = 0.33;

      const hitChance = source.hitChanceForDamageable(wall);

      expect(hitChance).toEqual(1);
    });

    test('when damageable is a wall behind cover', () => {
      const game = useGame();

      const source = createActor({ x: 1, y: 1 });
      const target = useMap().tileAt({ x: 5, y: 1 });

      const wall = new Wall(target);

      game.addMapEntity(wall);

      game.addMapEntity(new HalfWall(useMap().tileAt({ x: 4, y: 1 })));

      source.accuracyMultiplier = 0.75;
      (source.equippedWeapon as Gun).accuracy = 0.33;

      const hitChance = source.hitChanceForDamageable(wall);

      expect(hitChance).toEqual(1);
    });

    test('when damageable is an actor behind half cover', () => {
      const source = createActor({ x: 0, y: 0 });
      const target = createActor({ x: 5, y: 0 });

      useGame().addMapEntity(new HalfWall(useMap().tileAt({ x: 4, y: 0 })));

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.75);
    });

    test('when damageable is an actor behind full cover', () => {
      const source = createActor({ x: 0, y: 0 });
      const target = createActor({ x: 5, y: 0 });

      useGame().addMapEntity(new Wall(useMap().tileAt({ x: 4, y: 0 })));

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.5);
    });

    test('when damageable is an actor behind full cover and diagonal to shooter', () => {
      const source = createActor({ x: 0, y: 5 });
      const target = createActor({ x: 5, y: 0 });

      useGame().addMapEntity(new Wall(useMap().tileAt({ x: 4, y: 0 })));

      const hitChance = source.hitChanceForDamageable(target);

      expect(hitChance).toEqual(0.5);
    });
  });
});
