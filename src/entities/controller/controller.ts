import type { Tile } from '@/stores/map';
import MapEntity from '../map-entity';

export abstract class Controller<T extends MapEntity> extends MapEntity {
  constructor(tile: Tile, public controls: T) {
    super(tile);
  }
}
