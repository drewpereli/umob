import type { Tile } from '@/tile';
import MapEntity from '../map-entity';

export abstract class Controller<T extends MapEntity> extends MapEntity {
  constructor(tile: Tile, public controls: T) {
    super(tile);
  }
}
