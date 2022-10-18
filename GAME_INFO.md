# UMOB

## Cover system
If you're behind cover, and an enemy tries to shoot you from the direction of that cover, the hit chance is reduced.
Some terrain (like walls) give you "full" cover, while others (like half walls) give you "half" cover. Full cover reduced hit chance by 50%, while 
half cover reduces it by 25%. Enemies can also take cover.

You can have cover in each of the four cardinal directions. If an enemy shoots you from a direct diagonal, the maximum applicable cover will be applied. 
So for example, if you have full cover to the North and half cover to the East, and an enemy is directly north-east of you and shoots you, the north full-cover will apply and the hit chance will be reduced by 50%.
