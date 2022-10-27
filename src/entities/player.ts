import { BuildCover } from '@/powers/build-cover';
import { CreateBlackHole } from '@/powers/create-black-hole';
import { Grenade } from '@/powers/grenade';
import { Heal } from '@/powers/heal';
import type { Power } from '@/powers/power';
import { Burning } from '@/status-effects/burning';
import type { Tile } from '@/stores/map';
import { debugOptions } from '@/utils/debug-options';
import Creature, { CreatureAlignment } from './creatures/creature';
import type { Damageable } from './damageable';
import { defaultBurn, defaultStopBurning, type Flammable } from './flammable';
import type { Item } from './items/item';
import { ItemInMap } from './items/item-in-map';
import { Pipe } from './weapons/melee-weapon';
import { angleFromDir, type Dir } from '@/utils/map';
import type { Perk } from '@/perks';

export class Player extends Creature implements Flammable {
  defaultChar = '@';
  color = 'yellow';

  get rotateChar() {
    return angleFromDir(this.facing) + 90;
  }

  name = 'you';

  upgradePoints = 1;

  inventory: Item[] = [new Pipe()];

  alignment = CreatureAlignment.Ally;

  powers: Power[] = [
    new BuildCover(),
    new CreateBlackHole(),
    new Grenade(),
    new Heal(this),
  ];

  powerHotkeys: Record<string, Power> = this.powers.reduce(
    (acc, power, idx) => {
      if (idx >= 10) return acc;
      const hotKey = idx === 9 ? '0' : `${idx + 1}`;

      acc[hotKey] = power;

      return acc;
    },
    {} as Record<string, Power>
  );

  blocksView = false;

  health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  energy = debugOptions.infiniteEnergy ? Infinity : 100;
  maxEnergy = debugOptions.infiniteEnergy ? Infinity : 100;

  baseViewRange = debugOptions.infiniteViewRange ? Infinity : 10;
  viewAngle = debugOptions.fullViewAngle ? 360 : 90;

  mass = 100;

  burnCollocatedChance = 0.5;
  burnAdjacentChance = 0.1;
  burningDuration = 0;
  readonly IMPLEMENTS_FLAMMABLE = true;

  appliedPerkIds: string[] = [];

  get isBurning() {
    return this.statusEffects.some((effect) => effect.name === 'burning');
  }

  set isBurning(val: boolean) {
    //
  }

  receiveDamage(damage: number) {
    super.receiveDamage(damage);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }

  hitChanceForDamageable(damageable: Damageable & Coords) {
    if (debugOptions.infiniteAccuracy) return 1;

    return super.hitChanceForDamageable(damageable);
  }

  _act() {
    throw new Error('_act should not be called on Player');
  }

  wait() {
    if (!this.canAct) return;

    this.timeUntilNextAction = 1;
  }

  startBurning() {
    this.addStatusEffect(new Burning(this, 20));
  }

  burn() {
    defaultBurn(this);
    this.receiveDamage(1);
  }

  stopBurning() {
    defaultStopBurning(this);
    const burning = this.statusEffects.find((s) => s instanceof Burning);

    if (!burning) return;

    this.removeStatusEffect(burning);
  }

  pickupItem(item: Item) {
    this.inventory.push(item);
  }

  dropItem(item: Item) {
    const idx = this.inventory.indexOf(item);

    if (idx === -1) return;

    const inventory = this.inventory;
    inventory.splice(idx, 1);
    this.inventory = [...inventory];

    const mapItem = new ItemInMap(this.tile, item);

    this.game.addMapEntity(mapItem);
    this.game.view.draw();
  }

  updatePosition(tile: Tile) {
    super.updatePosition(tile);

    tile.items.forEach((itemInMap) => {
      this.pickupItem(itemInMap.item);
      itemInMap.shouldRemoveFromGame = true;
    });
  }

  updateFacing(dir: Dir) {
    this.facing = dir;
  }

  // Called in creature constructor
  updateLastSawPlayerIfCanSee() {
    //
  }

  hotKeyForPower(power: Power) {
    return Object.keys(this.powerHotkeys).find(
      (key) => this.powerHotkeys[key] === power
    );
  }

  applyPerk(perk: Perk) {
    perk.applyEffect(this);
    this.appliedPerkIds.push(perk.id);
    this.upgradePoints--;
  }

  hasPerk(perk: Perk) {
    return this.appliedPerkIds.includes(perk.id);
  }
}
