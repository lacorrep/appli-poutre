# En cours de développement

* Double-clic -> change le sens
* `resizable`: appliquer `resize_minWidth`
* Appliquer `gui.options.resizeTol` au CSS de jQueryUI `.ui-resizable-handle.ui-resizable-n`
## `rdm.js`
* Gérer les positions `x`, `x0`, `x1` en pixels correctement (offset avec le bord) !!!
* L'attribut objDOM de Liaison et Chargement n'est pas nécessaire, les données de l'interface sont lues mais jamais écrites (pas de contrôle de la vue par `rdm.js`)
* Déterminer `f1` pour les chargements répartis
* 

# Bugs connus

* Quand on place un appui à côté de la poutre, il est mal repositionné et ça bug quand on applique un chargement ensuite.
* Si on place un pivot bien à gauche et un appui au-delà de la moitié de la poutre vers la droite, quand on place une force concentrée (orientée vers le haut), la déformée est décroissante.
* Si on place un encastrement dans un coin et que l'on place un effort du côté le moins long, la déformée derrière l'encastrement est linéaire au lieu d'être constante et nulle.
* Sur des petites fenêtres, les titres `h4` rejettent des mots à la ligne ce qui désaligne les rectangles des efforts.
* Le centrage en CSS risque de ne pas fonctionner sous IE.

# Suggestions

* Laisser la possibilité à l'utilisateur de fixer manuellement l'échelle de la déformée ou pas ?
* Dessiner en SVG les liaisons et les chargements ?
* `gui.options` : nom mal choisi, ce ne sont pas vraiment des options.
* Gérer le problème de flexion indépendamment de la traction / compression si les CL le permettent ?
* Stocker les efforts de réaction dans les objets Liaison (pour les tracer ensuite ?)

# Améliorations

* 100% compatible mobile
* Traction / compression (forces horizontales)
* Chargements répartis variables (linéaires)
* Poutres en vibration
* Poutres hyperstatiques