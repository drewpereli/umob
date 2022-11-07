import { Heal } from '@/powers/heal';
import type { Power } from '@/powers/power';
import type { Tile } from '@/tile';
import { debugOptions } from '@/utils/debug-options';
import Creature, { CreatureAlignment } from './creatures/creature';
import type { Item } from './items/item';
import { ItemInMap } from './items/item-in-map';
import { Pipe } from './weapons/melee-weapon';
import { angleFromDir, type Dir } from '@/utils/map';
import type { Perk } from '@/perks';
import type { DamageType, Weapon } from './weapons/weapon';
import type { Usable } from './items/usable';
import { generateId } from '@/utils/id';

const r = new Pipe();

export class Player extends Creature {
  constructor(tile: Tile, public alignment = CreatureAlignment.WithPlayer) {
    super(tile);
  }

  id = 'PLAYER';

  defaultChar = '@';
  color = 'yellow';

  get rotateChar() {
    return this.game.directionViewMode ? 0 : angleFromDir(this.facing) + 90;
  }

  name = 'you';

  get messageDescriptor() {
    return 'you';
  }

  upgradePoints = 1;

  inventory: Item[] = [r];
  equippedWeapon: Weapon = r;

  powers: Power[] = [new Heal(this)];

  selectedPowerUsable: Usable | null = null;

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

  _health = debugOptions.infiniteHealth ? Infinity : 100;
  maxHealth = debugOptions.infiniteHealth ? Infinity : 100;

  baseViewRange = debugOptions.infiniteViewRange ? Infinity : 10;
  baseViewAngle = debugOptions.fullViewAngle ? 360 : 90;

  mass = 100;

  appliedPerkIds: string[] = [];

  receiveDamage(damage: number, type: DamageType) {
    super.receiveDamage(damage, type);

    if (this.health <= 0) {
      this.game.onPlayerDie();
    }
  }

  get accuracy() {
    if (debugOptions.infiniteAccuracy) {
      return Infinity;
    }

    return super.accuracy;
  }

  _act() {
    throw new Error('_act should not be called on Player');
  }

  wait() {
    if (!this.canAct) return;

    this.timeUntilNextAction = 1;
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
      itemInMap.markForRemoval();
    });
  }

  updateFacing(dir: Dir) {
    this.facing = dir;
  }

  // Called in creature constructor
  updateLastSawEnemy() {
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
  }

  hasPerk(perk: Perk) {
    return this.appliedPerkIds.includes(perk.id);
  }

  get visibleTiles() {
    throw new Error('Use game.visibleTiles');
    return [];
  }

  move(tile: Tile) {
    const oldTile = this.tile;

    const success = super.move(tile);

    if (success) {
      this.movementsTaken.push({
        id: generateId(),
        type: 'move',
        from: oldTile,
        to: this.tile,
      });
    }

    return success;
  }

  strafe(tile: Tile) {
    const oldTile = this.tile;

    const success = super.strafe(tile);

    if (success) {
      this.movementsTaken.push({
        id: generateId(),
        type: 'strafe',
        from: oldTile,
        to: this.tile,
      });
    }

    return success;
  }

  turn(dir: Dir) {
    const oldDir = this.facing;

    const success = super.turn(dir);

    if (success) {
      this.movementsTaken.push({
        id: generateId(),
        type: 'turn',
        from: oldDir,
        to: this.facing,
      });
    }

    return success;
  }

  movementsTaken: (
    | { id: string; type: 'turn'; from: Dir; to: Dir }
    | { id: string; type: 'move'; from: Tile; to: Tile }
    | { id: string; type: 'strafe'; from: Tile; to: Tile }
  )[] = [];

  selectedPower: Power | null = null;

  useSelectedPower() {
    if (!this.selectedPower) return;

    if (this.selectedPower.playerActivateIfPossible()) {
      this.timeUntilNextAction = this.selectedPower.useTime;
      return true;
    }
  }

  usePower() {
    throw new Error('Don\'t call "usePower" on player. Use "useSelectedPower"');
    return false;
  }
}
