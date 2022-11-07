import { random } from '@/utils/random';
import { CenturionArmor, FlameSuit } from '@/wearables/bodywear';
import { MilitaryHelmet, TargetingArrayHelmet } from '@/wearables/headwear';
import {
  ShotGun,
  Pistol,
  AssaultRifle,
  SubMachineGun,
  RailGun,
  Flamethrower,
  GiantRailGun,
  WaterJetCutterHead,
  GammaRayLaser,
  TeslaGun,
} from '../weapons/gun';
import { Pipe, Scalpel } from '../weapons/melee-weapon';
import type { Item } from './item';

class ProbNode {
  constructor(
    public value: typeof Item[] | null,
    public children: ProbNode[],
    public weight: number
  ) {}

  isLeaf(): this is { value: typeof Item[] } {
    return this.value !== null;
  }

  randValue(): typeof Item[] {
    if (this.isLeaf()) {
      return this.value;
    }

    const child = random.weightedArrayElement(
      this.children,
      this.children.map((child) => child.weight)
    );

    return child.randValue();
  }
}

const meleeWeapons = new ProbNode([Pipe, Scalpel], [], 1);
const rangedWeapons = new ProbNode(
  [
    ShotGun,
    Pistol,
    AssaultRifle,
    SubMachineGun,
    RailGun,
    Flamethrower,
    GiantRailGun,
    WaterJetCutterHead,
    GammaRayLaser,
    TeslaGun,
  ],
  [],
  1
);

const bodyWear = new ProbNode([CenturionArmor, FlameSuit], [], 1);
const headWear = new ProbNode([MilitaryHelmet, TargetingArrayHelmet], [], 1);

const weapons = new ProbNode(null, [meleeWeapons, rangedWeapons], 1);
const wearables = new ProbNode(null, [bodyWear, headWear], 1);

export const findableItems = new ProbNode(null, [weapons, wearables], 1);
