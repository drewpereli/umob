import Creature from './creature';

export class Rat extends Creature {
  name = 'rat';
  mass = 1;
  defaultChar = 'r';
  color = 'white';

  unarmedAttackData = {
    ...super.unarmedAttackData,
    attackActionMessageDescription: 'tried to bite',
  };
}
