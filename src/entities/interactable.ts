import type MapEntity from './map-entity';

export type Interactable = MapEntity & {
  isCurrentlyInteractable: boolean;
  readonly IMPLEMENTS_INTERACTABLE: true;
  onInteract: () => unknown;
};

export function isInteractable(e: MapEntity): e is Interactable {
  return 'IMPLEMENTS_INTERACTABLE' in e;
}
