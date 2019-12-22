// Variable globale
// Éléments, options et paramètres de l'interface graphique
var glob = {
	// canvas_ratio_width : calculé dans control.js pour être responsive
	//beam_ends_offset: calculé dans control.js pour être responsive
	// canvas_ratio_height: 0.40, // pourcentage de la largeur de canvas à utiliser comme hauteur de canvas
	amp_u: 1, // amplitude de la déformée horizontale
	amp_v: 10, // amplitude de la déformée verticale
	amp_N: 1, // amplitude de l'effort normal
	amp_T: 1, // amplitude de l'effort tranchant
	amp_M: 1, // amplitude de l'effort de flexion
	amp_max_defo: 0.85, // amplitude maximale de la déformée en % de la hauteur du canvas (par défaut)
	amp_max_effort: 0.9, // amplitude maximale des diagrammes des efforts intérieurs en % de la hauteur du canvas (par défaut)
	defo_epaisseur: 4, // épaisseur du trait de la déformée (en pixels)

	force_intensity_scale: 5, // force (en Newton) pour un flèche d'une hauteur d'un quart du canvas
	moment_intensity_scale: 100, // moment (en Newton.mètre) pour un flèche d'une hauteur d'un quart du canvas

	drag_opacity: 0.6, // opacité des éléments quand ils sont "dragged"
	resize_minWidth: 10, // plus petite épaisseur d'un chargement réparti // TODO
	resizeTol: 10, // distance minimale entre le curseur et le bord d'un chargement pour modifier son intensité / sa zone d'effet
	snapTol: 7, // tolérance pour snapper les CL et efforts

	showLinkingReactions: false, // montrer les efforts de liaison

	showSections: false, // montrer les sections
	number_of_sections: 20, // nombre de sections à dessiner
	section_lowest_y: -40, // ordonnée du point le plus bas dans une section (dépend de si c'est un cercle, un triangle...)
	section_highest_y: 20, // ordonnée du point le plus haut dans une section
}