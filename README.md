# appli-poutre

Application web sur les poutres d'Euler-Bernoulli pour expérimenter avec les liaisons et les efforts.

## Structure du code
* `index.html` Page web de l'application.
* `css/style1.css` Feuille de style par défaut.
* `js/array_math.js` Fonctions utiles pour effectuer des opérations mathématiques sur les Array.
* `js/control.js` Définition des interactions avec les éléments de la page.
* `js/glob.js` Paramètres globaux de l'application.
* `js/rdm.js` (Résistance Des Matériaux) Code pour les calculs de physique, gestion des liaisons et chargements.
* `notes_de_dev/` Notes de développement et liste des choses à faire.
  
## Dépendances

* [jQuery](http://jquery.com/)
* [jQueryUI](http://jqueryui.com/)
* [jQuery UI Touch Punch](http://touchpunch.furf.com/)
* [jQuery longpress](https://github.com/vaidik/jquery-longpress)
* [Bootstrap](https://getbootstrap.com/)

## Bugs connus / To do list
* Les liaisons et les forces sont invisibles lorsqu'elles sortent de `div#menus`
* Si on place une force concentrée avant de placer un encastrement, on ne peut plus retourner la force en double-cliquant.
* Parfois l'échelle et les erreurs d'arrondis font que la déformée n'est pas nulle du côté d'un encastrement où il n'y a pas d'efforts.

## Liens utiles

### HTML & CSS

* [W3Schools - HTML reference](https://www.w3schools.com/tags/default.asp)
* [W3Schools - CSS reference](https://www.w3schools.com/cssref/default.asp)
* [W3Schools - JavaScript reference](https://www.w3schools.com/jsref/default.asp)
* [How To Center In CSS](http://howtocenterincss.com/), [Understanding `vertical-align`](http://phrogz.net/CSS/vertical-align/index.html)

### Résistance des matériaux

* [Wikipédia - Théorie des poutres](https://fr.wikipedia.org/wiki/Th%C3%A9orie_des_poutres)

## Temps de développement

### Date et nombre d'heures
* 28/06/2017 : 4
* 30/06/2017 : 1
* 02/07/2017 : 1
* 03/07/2017 : 2
* 04/07/2017 : 4
* 09/07/2017 : 3
* 25/07/2017 : 3
* 27/07/2017 : 1
* 24/08/2017 : 4
* 20/09/2017 : 1
* 26/12/2017 : 1
* 29/01/2018 : 1
* 30/01/2018 : 2
* 04/02/2018 : 5
* 05/02/2018 : 3
* 06/06/2019 : 1