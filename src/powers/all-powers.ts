import { Hypnotize } from './add-status-effect-to-other';
import {
  ActivateOcclusionVisualizer,
  ActivateTargetingArray,
} from './add-status-effect-to-self';
import { Blink } from './blink';
import { BuildCover } from './build-cover';
import { CreateBlackHole, BlackHole } from './create-black-hole';
import { CreateFireProximityMine } from './create-fire-proximity-mine';
import { CreateFireTripWire } from './create-fire-trip-wire';
import { CreateLavaPool } from './create-lava-pool';
import { CreateProximityMine } from './create-proximity-mine';
import { CreateTripWire } from './create-trip-wire';
import { CreateWaterPool } from './create-water-pool';
import { Grenade } from './grenade';
import { Heal } from './heal';
import { Pull } from './pull';
import { Push } from './push';
import { SmokeGrenade } from './smoke-grenade';
import { SummonAutoTurret } from './summon-auto-turret';

export const allPowers = [
  Hypnotize,
  ActivateOcclusionVisualizer,
  ActivateTargetingArray,
  Blink,
  BuildCover,
  CreateBlackHole,
  CreateFireProximityMine,
  CreateFireTripWire,
  CreateLavaPool,
  CreateProximityMine,
  CreateTripWire,
  CreateWaterPool,
  Grenade,
  Heal,
  Pull,
  Push,
  SmokeGrenade,
  SummonAutoTurret,
] as const;
