import { NonTargetedPower } from './non-targeted-power';

export class Heal extends NonTargetedPower {
  readonly name = 'heal';
  useTime = 2;
  energyCost = 10;

  activate() {
    if (this.owner.health >= this.owner.maxHealth) return;

    this.owner.health = Math.min(this.owner.maxHealth, this.owner.health + 10);

    return true;
  }
}
