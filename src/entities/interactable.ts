import { Dir, dirsBetween } from '@/utils/map';
import type MapEntity from './map-entity';

export type Interactable = MapEntity & {
  isCurrentlyInteractable: boolean;
  readonly IMPLEMENTS_INTERACTABLE: true;
  onInteract: () => unknown;
  interactableFromDir?: Dir; // If you can only interact with it from a certain direction. e.g. a button on a wall facing down can only be interacted with from the tile beneath it, so this should be set to Dir.Down. If it's undefined, any angle is valid
};

export function isInteractable(e: MapEntity): e is Interactable {
  return 'IMPLEMENTS_INTERACTABLE' in e;
}

export function canInteractWithFrom(e: Interactable, coords: Coords): boolean {
  const interactableFromDir = e.interactableFromDir;

  if (!interactableFromDir) {
    return true;
  }

  return dirsBetween(e, coords).includes(interactableFromDir);
}
