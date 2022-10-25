import type { Tile } from '@/stores/map';
import type { AsciiDrawable } from '@/utils/types';
import MapEntity, { EntityLayer } from '../map-entity';
import type { Item } from './item';

export function isItemInMap(entity: MapEntity): entity is ItemInMap {
  return entity instanceof ItemInMap;
}

export class ItemInMap extends MapEntity implements AsciiDrawable {
  constructor(tile: Tile, public item: Item) {
    super(tile);
    this.char = item.char;
    this.color = item.color;
  }

  blocksView = false;
  blocksMovement = false;
  layer = EntityLayer.Item;
  shouldRemoveFromGame = false;
  mass = 0;

  char: string;
  color: string;
}
