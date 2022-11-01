# UMOB

## Base Status
### Accuracy and Evasion
Every creature has an "accuracy" value and an "evasion" value. When you attack a creature, the game generates a number between 0 and the attackers accuracy, and another 
between 0 and the attack-ees evasion. If the first number is higher than the second, the attack hits. Otherwise it misses. There is always a 5% chance, that the 
attack will miss, and also always a 5% chance the attack will hit, regardless of the difference in evasion/accuracy.

Weapons have an "accuracy bonus" that can either add to or subtract from your effective accuracy.

Cover also effects accuracy and evasion. See "Cover system" below.

## Guns and Gun Effects

### Knock-back
Some guns have "knock-back". If you shoot an enemy with a gun with knock-back, they will be knocked back in the direction of the shot. 
If there is another actor behind the actor that was shot, that actor will take 1/4 of the gun's damage.
If there is a wall behind the actor that was shot, the actor that was shot will take an additional 1/4 of the gun's damage.

## Flanking
Guns have a flanking bonus, which is 50% by default. If you shoot an enemy in the side, it does +flanking-bonus damage.
If you shoot them in the back, it does +2 x flanking-bonus damage.
Same goes for if enemies shoot you.

## Cover system
If you're behind cover, and an enemy tries to shoot you from the direction of that cover, the hit chance is reduced.
Some terrain (like walls) give you "full" cover, while others (like half walls) give you "half" cover. Full cover gives 50% more evasion in that direction, while 
half cover gives 100%. Enemies can also take cover.

You can have cover in each of the four cardinal directions. If an enemy shoots you from a direct diagonal, the maximum applicable cover will be applied. 
So for example, if you have full cover to the North and half cover to the East, and an enemy is directly north-east of you and shoots you, the north full-cover will apply and your effective evasion will be doubled.

## Radiation
You build up radiation by being near radioactive things, being attacked with certain weapons, etc. You lose a certain number of rads per turn. The effects of radiation depend on 
how many rads you've accumulated.

* Low (50 rads +): view range reduced by 2 tiles
* Medium (100 rads +): accuracy reduced by 2
* High (200 rads +): move time doubled. Take 1% of your max health as damage per turn
* Extreme (400 rads +): move time tripled. Energy recharge rate is 0. Take 2% of your max health as damage per turn
