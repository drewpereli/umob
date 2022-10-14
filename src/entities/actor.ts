import {
  BulletAnimation,
  DamageAnimation,
  useAnimations,
  type GameAnimation,
} from '@/stores/animations';
import { useGame } from '@/stores/game';
import { distance, type Tile } from '@/stores/map';
import { debugOptions } from '@/utils/debug-options';
import { Grenade, type Power } from '@/utils/powers';
import { random } from '@/utils/random';
import { Pistol, ShotGun } from './gun';

enum Mood {
  Hostile = 'hostile',
}

export default class Actor {
  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  name = 'actor';

  x;
  y;

  health = 100;
  maxHealth = 100;

  moveTime = 2;
  attackTime = 2;

  timeUntilNextAction = 0;

  penetrationBlock = 1;

  viewRange = 10;

  accuracyMultiplier = 1;
  evasionMultiplier = 1;

  inventory = [new Pistol()];
  equippedWeapon = this.inventory[0];

  powers = [new Grenade()];
  selectedPower: Power | null = null;

  char = 'd';
  readonly color: string = 'white';

  readonly game = useGame();
  readonly animationsStore = useAnimations();

  mood = Mood.Hostile;

  move(tile: Tile) {
    if (!this.canAct) return;

    this.x = tile.x;
    this.y = tile.y;
    this.timeUntilNextAction =
      this.moveTime * (tile.terrain.moveTimeMultiplier as number);
  }

  fireWeapon(actors: Actor[]) {
    if (!this.canAct) return;

    actors.forEach((actor, idx) => {
      const hitChance =
        this.equippedWeapon.accuracy *
        this.accuracyMultiplier *
        actor.evasionMultiplier;

      const willHit = random.float(0, 1) < hitChance;

      if (willHit) actor.receiveFire(this.equippedWeapon.damage);

      if (idx === 0) {
        this.game.animations.addAnimation(
          new BulletAnimation(this, actor, willHit)
        );
      }
    });

    this.timeUntilNextAction =
      this.attackTime * this.equippedWeapon.attackTimeMultiplier;
  }

  useSelectedPower() {
    if (!this.selectedPower) return;

    this.selectedPower.activate();
    this.timeUntilNextAction = this.selectedPower.useTime;
  }

  receiveFire(damage: number) {
    this.health = Math.max(this.health - damage, 0);

    if (this.game.coordsVisible(this)) {
      const animation = new DamageAnimation(this);
      this.animationsStore.addAnimation(animation);
    }
  }

  tick() {
    if (this.timeUntilNextAction > 0) {
      this.timeUntilNextAction--;
    }
  }

  get canAct() {
    return this.timeUntilNextAction === 0 && !this.isDead;
  }

  get isDead() {
    return this.health <= 0;
  }

  act() {
    if (debugOptions.docileEnemies) return;

    if (!this.canAct) return;

    if (this.mood === Mood.Hostile) {
      if (this.canAttackPlayer) return this.fireWeapon([this.game.player]);

      if (this.canSeePlayer) {
        const coordsPathToPlayer = this.game.map.pathBetween(
          this.coords,
          this.game.player.coords,
          this
        );

        const coordsTowardsPlayer = coordsPathToPlayer[1];

        if (!coordsTowardsPlayer) return;

        const tile = this.game.map.tileAt(coordsTowardsPlayer);

        if (!this.canMoveTo(tile)) return;

        this.move(tile);
      }
    }
  }

  get coords(): Coords {
    return { x: this.x, y: this.y };
  }

  get canAttackPlayer() {
    if (!this.canSeePlayer) return false;
    if (!this.equippedWeapon) return false;

    const dist = distance(this, this.game.player);

    if (dist > this.equippedWeapon.range) return false;

    const tilesBetween = this.game.map
      .tilesBetween(this, this.game.player)
      .slice(1, -1);

    const aimIsBlocked = tilesBetween.some(
      (tile) => tile.terrain.penetrationBlock > 0
    );

    return !aimIsBlocked;
  }

  get canSeePlayer() {
    if (distance(this, this.game.player) > this.viewRange) return false;

    return true;
  }

  canMoveTo(tile: Tile) {
    if (tile.terrain.blocksMovement) return false;
    if (this.game.actorAt(tile)) return false;
    return true;
  }
}
