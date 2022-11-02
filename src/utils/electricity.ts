import { isDamageable } from '@/entities/damageable';
import type MapEntity from '@/entities/map-entity';
import { DamageType } from '@/entities/weapons/weapon';
import type { Tile } from '@/tile';

export function electrocute(startTile: Tile, amount: number) {
  const processedTileIds: Map<string, true> = new Map();

  const toProcess: Tile[] = [startTile];

  if (startTile.electrocutables.length === 0) return;

  while (toProcess.length) {
    const tile = toProcess.pop() as Tile;

    processedTileIds.set(tile.id, true);

    const electrocutables = tile.electrocutables;

    electrocutables.forEach((e) => {
      if (isDamageable(e)) {
        e.receiveDamage(amount, DamageType.Electric);
      }
    });

    tile.adjacentTiles.forEach((t) => {
      if (t.electrocutables.length > 0 && !processedTileIds.has(t.id)) {
        toProcess.push(t);
      }
    });
  }
}

export function isElectrocutable(
  e: MapEntity
): e is MapEntity & { conductsElectricity: true } {
  return e.conductsElectricity;
}
