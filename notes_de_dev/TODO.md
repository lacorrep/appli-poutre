# En cours

* Le double-clic doit inverser le sens de l'effort.
* Changer l'apparence des moments.
* `resizable` : appliquer `glob.param.resize_minWidth`
* Appliquer `glob.param.resizeTol` au CSS de jQueryUI `.ui-resizable-handle.ui-resizable-n`
## `rdm.js`
* Gérer les positions `x`, `x0`, `x1` en pixels correctement (offset avec le bord) !!!
* L'attribut `objDOM` des `Liaison` et `Chargement` n'est pas nécessaire, les données de l'interface sont lues mais jamais écrites (pas de contrôle de la vue par `rdm.js`)
* `moment_intensity_scale` : tout passer dans `rdm.js`
* Déterminer `f1` pour les chargements répartis

# Bugs connus

* Si on place un encastrement dans un coin et que l'on place un effort du côté le moins long, la déformée derrière l'encastrement est linéaire au lieu d'être constante et nulle. ! L'échelle devient énorme (donc déplacement très faibles), mais c'est avant tout un problème au niveau des efforts / de l'intégration.
* Si on place un pivot bien à gauche et un appui au-delà de la moitié de la poutre vers la droite, quand on place une force concentrée (orientée vers le haut), la déformée est décroissante.
* Sur des petites fenêtres, les titres `h4` rejettent des mots à la ligne ce qui désaligne les rectangles des efforts.
* Le centrage en CSS risque de ne pas fonctionner sous IE.

# Suggestions

* Stocker la variable `poutre` dans `glob` ?
* Est-ce qu'il n'y aurait pas un problème dans `controle.js` ? Le drop des `.cl_instance` et `.ch_instance` semble être défini 2 fois. Peut-on réduire le code ?
* Une force répartie de même largeur qu'une force concentrée (en apparence) devrait avoir la même intensité (moins confus visuellement).
* Dessiner en SVG les liaisons et les chargements ?
* Gérer le problème de flexion indépendamment de la traction / compression si les CL le permettent ?
* Stocker les efforts de réaction dans les objets Liaison (pour les tracer ensuite ?)

# Améliorations futures

* 100% compatible mobile
* Traction / compression (forces horizontales, amplitude de la déformée...)
* Chargements répartis variables (linéaires)
* Poutres en vibration
* Poutres hyperstatiques