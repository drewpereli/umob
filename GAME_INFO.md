# UMOB

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
Some terrain (like walls) give you "full" cover, while others (like half walls) give you "half" cover. Full cover reduced hit chance by 50%, while 
half cover reduces it by 25%. Enemies can also take cover.

You can have cover in each of the four cardinal directions. If an enemy shoots you from a direct diagonal, the maximum applicable cover will be applied. 
So for example, if you have full cover to the North and half cover to the East, and an enemy is directly north-east of you and shoots you, the north full-cover will apply and the hit chance will be reduced by 50%.

## Radiation
You build up radiation by being near radioactive things, being attacked with certain weapons, etc. You lose a certain number of rads per turn. The effects of radiation depend on 
how many rads you've accumulated.

* Low (50 rads +): view range reduced by 2 tiles
* Medium (100 rads +): accuracy reduced by 50%
* High (200 rads +): move time doubled. Take 1% of your max health as damage per turn
* Extreme (400 rads +): move time tripled. Energy recharge rate is 0. Take 2% of your max health as damage per turn
