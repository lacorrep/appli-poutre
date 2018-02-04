// Variable globale
// Éléments et options de l'interface graphique
var gui = {};

// Options / paramètres
gui.options = {
	canvas_height: 400, // hauteur (en pixels) du canvas pour la déformée
	canvas_width: 800, // largeur (en pixels)
	beam_ends_offset: 40, // distance (en pixels) entre le bord de la zone de dessin et chaque extrêmité de la poutre
	drag_opacity: 0.6, // opacité des éléments quand dragged
	snapTol: 7, // tolérance pour snapper les CL et efforts
	resize_minWidth: 10, // plus petite épaisseur d'un chargement réparti // TODO
	defo_epaisseur: 3, // épaisseur du trait de la déformée en px
	defo_amplitude: 0.8, // amplitude maximale de la déformée en %
	resizeTol: 10, // distance minimale entre le curseur et le bord d'un chargement pour modifier son intensité / sa zone d'effet
	force_intensity_scale: 10, // force maximale pour une hauteur de la moitié du canvas
	moment_intensity_scale: 5, // moment maximal pour une hauteur de la moitié du canvas
}