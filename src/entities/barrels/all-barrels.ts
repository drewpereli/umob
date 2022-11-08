import { ExplosiveBarrel } from './explosive-barrel';
import { OilBarrel } from './oil-barrel';
import { ToxicWasteBarrel } from './toxic-waste-barrel';
import { WaterBarrel } from './water-barrel';

export const allBarrels = [
  ExplosiveBarrel,
  OilBarrel,
  ToxicWasteBarrel,
  WaterBarrel,
] as const;
