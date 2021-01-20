# En cours

* Le double-clic inverse le sens de l'effort. Cesse parfois de fonctionner...
* `resizable` : appliquer `glob.resize_minWidth`
* Appliquer `glob.resizeTol` au CSS de jQueryUI `.ui-resizable-handle.ui-resizable-n`
## `rdm.js`
* Gérer les positions `x`, `x0`, `x1` en pixels correctement (offset avec le bord) !!!
* L'attribut `objDOM` des `Liaison` et `Chargement` n'est pas nécessaire, les données de l'interface sont lues mais jamais écrites (pas de contrôle de la vue par `rdm.js`)
* Déterminer `f1` pour les chargements répartis

# Bugs connus

* "Fixer l'échelle" ne se met plus à jour après avoir été activé 1 fois.
* Si on place un encastrement dans un coin et que l'on place un effort du côté le moins long, la déformée derrière l'encastrement est linéaire au lieu d'être constante et nulle. ! L'échelle devient énorme (donc déplacement très faibles), mais c'est avant tout un problème au niveau des efforts / de l'intégration.
* Si on place un pivot bien à gauche et un appui au-delà de la moitié de la poutre vers la droite, quand on place une force concentrée (orientée vers le haut), la déformée est décroissante.
* Sur des petites fenêtres, les titres `h4` rejettent des mots à la ligne ce qui désaligne les rectangles des efforts.
* Le centrage en CSS risque de ne pas fonctionner sous IE.

# Suggestions

* Stocker la variable `poutre` dans `glob` ?
* Est-ce qu'il n'y aurait pas un problème dans `controle.js` ? Le drop des `.cl_instance` et `.ch_instance` semble être défini 2 fois. Peut-on réduire le code ?
* Une force répartie de même largeur qu'une force concentrée (en apparence) devrait avoir la même intensité (moins confus visuellement).
* Gérer le problème de flexion indépendamment de la traction / compression si les CL le permettent ?
* Dessiner en SVG les liaisons et les chargements ?
* Agrandir les images des liaisons ?
* Stocker les efforts de réaction dans les objets Liaison (pour les tracer ensuite ?) (?)

# Améliorations futures

* Traction / compression (forces horizontales, amplitude de la déformée...)
* 100% compatible mobile (désactiver le scroll)
* Chargements répartis variables (linéaires)
* Poutres hyperstatiques
* Poutres en vibration