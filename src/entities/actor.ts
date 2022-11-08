import { isFlammable } from './flammable';
import MapEntity from './map-entity';

export function actorCache(cacheKey: keyof Actor['__cache']): MethodDecorator {
  return function (
    _target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalGetter = descriptor.get;

    const strPropKey = String(propertyKey);

    descriptor.get = function (this: Actor) {
      const cached = this.__cache[cacheKey][strPropKey];
      if (cached) {
        return cached;
      }
      const val = originalGetter?.bind(this)();
      this.__cache[cacheKey][strPropKey] = val;
      return val;
    };
  };
}

export abstract class Actor extends MapEntity {
  abstract canAct: boolean;
  abstract _act(): void;

  timeUntilNextAction = 0;

  actIfPossible() {
    if (!this.canAct) return;
    this._act();
    this.__cache.act = {};
  }

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
    }

    this.__cache.tick = {};
  }

  __cache: Record<'tick' | 'act', Record<string, unknown>> = {
    tick: {},
    act: {},
  };
}
