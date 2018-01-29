# En cours de développement
* Permettre le changement d'orientation des forces
* resizable: imposer resize_minWidth
## `rdm.js`
* gérer les positions x, x0, x1 en pixels correctement (offset avec le bord) !!!
* a priori l'attribut objDOM de Liaison et Chargement n'est pas nécessaire, les données de l'interface sont lues mais jamais écrites (pas de contrôle de la vue par rdm.js)
* déterminer f1 pour les chargements répartis

# Bugs connus
* Si on place un encastrement dans un coin et que l'on place un effort du côté le moins long, la déformée derrière l'encastrement est linéaire au lieu d'être constante et nulle.

# Suggestions
* Laisser la possibilité à l'utilisateur de fixer manuellement l'échelle de la déformée ou pas ?
* Dessiner en SVG les liaisons et les chargements ?
* `gui.options` : nom mal choisi, ce ne sont pas vraiment des options.
* Gérer le problème de flexion indépendamment de la traction/compression si les CL le permettent ?

# Améliorations
* 100% compatible mobile
* Traction / compression
* Poutres en vibration
* Poutres hyperstatiques