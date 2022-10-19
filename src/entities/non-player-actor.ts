import Actor from './actor';

export abstract class NonPlayerActor extends Actor {
  abstract act(): void;
}
