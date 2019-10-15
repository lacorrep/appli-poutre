// Variable globale

// Éléments, options et paramètres de l'interface graphique
var glob = {};

// Paramètres
glob.param = {
	// canvas_height: NaN, // hauteur (en pixels) du canvas où on trace la déformée
	// canvas_width: NaN, // largeur (en pixels)
	// canvas_ratio_width: NaN, // pourcentage de la largeur de page à utiliser comme largeur de canvas
	amp_u: 1, // amplitude de la déformée horizontale
	amp_v: 10, // amplitude de la déformée verticale
	amp_N: 1, // amplitude de l'effort normal
	amp_T: 1, // amplitude de l'effort tranchant
	amp_M: 1, // amplitude de l'effort de flexion
	amp_max_defo: 0.85, // amplitude maximale de la déformée en % de la hauteur du canvas (par défaut)
	amp_max_effort: 0.9, // amplitude maximale des diagrammes des efforts intérieurs en % de la hauteur du canvas (par défaut)
	beam_ends_offset: NaN, // distance (en pixels) entre le bord de la zone de dessin et chaque extrêmité de la poutre
	canvas_ratio_height: 0.40, // pourcentage de la largeur de canvas à utiliser comme hauteur de canvas
	defo_epaisseur: 4, // épaisseur du trait de la déformée (en pixels)
	drag_opacity: 0.6, // opacité des éléments quand ils sont "dragged"
	force_intensity_scale: 5, // force pour un flèche d'une hauteur d'un quart du canvas (conversion pixels -> Newton) // ATTENTION : pas ce qui est fait actuellement
	moment_intensity_scale: 100, // moment pour un flèche d'une hauteur d'un quart du canvas (conversion pixels -> Newton) // ATTENTION : pas ce qui est fait actuellement
	resize_minWidth: 10, // plus petite épaisseur d'un chargement réparti // TODO
	resizeTol: 10, // distance minimale entre le curseur et le bord d'un chargement pour modifier son intensité / sa zone d'effet
	showLinkingReactions: false, // montrer les efforts de liaison
	snapTol: 7, // tolérance pour snapper les CL et efforts
}