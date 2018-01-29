var poutre = new Poutre();

function debugmode() {
	// Active les outils de débugage
	$("#debug-tools").css("display","block"); // DEBUG
}

// onDomReady
$(function(){

// debugmode()

gui.canvas = $("#canvas_defo")[0];
// Mise en forme du canvas
$("#canvas_defo").attr({height: gui.options.canvas_height, width: gui.options.canvas_width})
$("#zone_drop_barre").css({height: gui.options.canvas_height, width: gui.options.canvas_width})
$("#barre").css({height: gui.options.defo_epaisseur, width: gui.options.canvas_width - 2*gui.options.beam_ends_offset})

// Pas de sélection du texte dans les menus
$(".menu").disableSelection();

// Explication de ce qu'est un ddl avec la balise abbr
$("ddl").replaceWith('<abbr title="Degré de liberté">ddl</abbr>')

// DEBUG
// $("html").mousedown(function(e) {
// 	// console.log(e.which);
// 	if( e.which === 2 ) {
// 		e.preventDefault();
// 		poutre.compute_defo(gui.canvas)
// 		poutre.dessiner_defo(gui.canvas)
// 	}
// });



// Drag & drop Liaisons

$(".cl_distributeur").draggable({
	snap: ".cl_instance, .cl_instance", // s’accroche aux autres CL
	snapTolerance: gui.options.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: gui.options.drag_opacity,
	cursor: "move"
})

// Drag & drop Chargements

$(".ch_distributeur").draggable({
	snap: ".cl_instance, .ch_instance", // s’accroche aux autres CL
	snapTolerance: gui.options.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: gui.options.drag_opacity,
	cursor: "move"
})

// Zone de drop

$("#zone_drop_barre").droppable({
	accept: ".cl_distributeur, .cl_instance, .ch_distributeur, .ch_instance",
	tolerance: "pointer",
	drop: function(evt, ui)
	{
		// Cet événement est appelé lorsque :
		// - le distributeur est déposé sur la zone
		// - une instance rentre ou sort dans la zone (suppression)

		var pos_x = Math.floor( ui.draggable.offset().left - $(this).offset().left );
		if( pos_x < gui.options.beam_ends_offset ) pos_x = gui.options.beam_ends_offset;
		if( pos_x > gui.options.canvas_width - gui.options.beam_ends_offset ) pos_x = gui.options.canvas_width - gui.options.beam_ends_offset;

		// Si c'est une instance à déplacer

		if( ui.draggable.hasClass("cl_instance") )
		{
			ui.draggable.css({top:"", bottom:"50%", left:pos_x}); // TODO top hardcodé
		}

		if( ui.draggable.hasClass("ch_instance") )
		{
			ui.draggable.css({top:"", bottom:"50%", left:pos_x}); // TODO top hardcodé
		}

		// Si c'est un distributeur de CL

		if( ui.draggable.hasClass('cl_distributeur') )
		{
			var nom_liaison = ui.draggable.attr("id").slice(10); // retirer "cl_distri_"
			switch( nom_liaison )
			{
				case "appui":
				case "pivot":
				case "encastrement":
					var eltDOM = $('<span class="cl_instance cl_'+nom_liaison+'" style="left:'+pos_x+'px"></span>')[0];
					$(this).append(eltDOM);
					poutre.ajouter_liaison(eltDOM, nom_liaison, "Y", pos_x); // TODO axe
					break;
				default:
					alert("Erreur : liaison de type inconnu");
			}
			renouveller_interaction();
		}

		// Si c'est un distributeur de Chargements

		if( ui.draggable.hasClass('ch_distributeur') )
		{
			var nom_liaison = ui.draggable.attr("id").slice(10); // retirer "ch_distri_"
			switch( nom_liaison )
			{
				case "f_c":
				case "m_c":
					// Concentré
					var eltDOM = $('<span class="ch_instance ch_'+nom_liaison+'" style="left:'+pos_x+'px"></span>')[0];
					$(this).append(eltDOM);
					poutre.ajouter_chargement(eltDOM, nom_liaison, "Y", pos_x, 1); // TODO remplacer 1 par une hauteur de base
					break;
				case "f_r":
				case "m_r":
					// Réparti
					// calculer la largeur de l'élément
					var hauteur = ui.draggable.height();
					var largeur = ui.draggable.width();
					var eltDOM = $('<span class="ch_instance ch_'+nom_liaison+'" style="left:'+pos_x+'px"></span>')[0];
					$(this).append(eltDOM);
					poutre.ajouter_chargement(eltDOM, nom_liaison, "Y", pos_x, hauteur, pos_x+largeur, hauteur);
					break;
				default:
					alert("Erreur : chargement de type inconnu");
			}
			renouveller_interaction();
		}

		update_defo();
	},
	over: function(evt, ui)
	{
		// Si c'est une instance dans la zone
		if( ui.draggable.hasClass("cl_instance") || ui.draggable.hasClass("ch_instance") )
		{
			$(ui.draggable).removeClass("toBeRemoved");
			$(ui.draggable).clearQueue().stop().fadeIn(0);
		}
	},
	out: function (evt, ui)
	{
		// Si c'est une instance dans la zone
		if( ui.draggable.hasClass("cl_instance") || ui.draggable.hasClass("ch_instance") )
		{
			$(ui.draggable).addClass("toBeRemoved").fadeOut(300, function() {
				if( $(ui.draggable).hasClass("toBeRemoved") )
				{
					// TODO code à effacer si modification fonctionne
					if( $(ui.draggable).hasClass("cl_instance") ) poutre.retirer_liaison( $(this)[0] );
					if( $(ui.draggable).hasClass("ch_instance") ) poutre.retirer_chargement( $(this)[0] );
					$(this).remove();

					update_defo();
				}
			});
		}
	}
})

}) // Fin onDomReady




//  Fonctions

function update_defo()
{
	// Vérifier et afficher l'isostaticité
	if( poutre.isostatique() )
	{
		$("#estIso").html("est isostatique");
		$("#zone_drop_barre").removeClass("frozen");
		// Calculer la déformée
		poutre.compute_defo(gui.canvas);
		// Redessiner la poutre
		poutre.dessiner_defo(gui.canvas);
	}
	else
	{
		$("#estIso").html("n'est pas isostatique");
		$("#zone_drop_barre").addClass("frozen");
	}
}

function renouveller_interaction()
// Lors de la création de nouveaux éléments, redéfinir les interactions possibles
{
	$(".cl_instance, .ch_instance").draggable({
		snap: ".cl_instance, .ch_instance", // s'accroche aux autres CL
		snapTolerance: gui.options.snapTol,
		opacity: gui.options.drag_opacity,
		cursor: "move",
		stop: function(evt,ui)
		{
			var elt = $(ui.helper[0]);

			// Ne pas traiter si l'objet est en cours de suppression
			if( elt.hasClass("toBeRemoved") )
				return;
			// {
			// 	console.log("@@@@ removing"); // DEBUG
			// 	console.log( elt ); // DEBUG
			// 	console.log( ui.helper[0] ); // DEBUG

			// 	if( elt.hasClass("cl_instance") ) poutre.retirer_liaison( ui.helper[0] ); // TODO $(this)[0] ?
			// 	if( elt.hasClass("ch_instance") ) poutre.retirer_chargement( ui.helper[0] );
			// 	elt.remove();
			// 	return;
			// }

			var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
			if( elt.hasClass("ch_f_c") || elt.hasClass("ch_m_c") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x, elt.height()); // TODO changement d'axe ; intégrer changement d'intensité
				// console.log(poutre.chargements.get(elt[0]).x0); // DEBUG
			}
			if( elt.hasClass("ch_f_r") || elt.hasClass("ch_m_r") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x, elt.height(), pos_x+elt.width()); // TODO changement d'axe ; intégrer changement d'intensité
				// console.log( [ poutre.chargements.get(elt[0]).x0 , poutre.chargements.get(elt[0]).x1 ] ); // DEBUG
			}
			if( elt.hasClass("cl_instance") )
			{
				poutre.modifier_liaison(elt[0], "Y", pos_x); // TODO changement d'axe
				// console.log(poutre.liaisons.get(elt[0]).x); // DEBUG
			}

			update_defo(); // nécessaire après avoir resizé
		}
	})

	// Draggable resizable : envelopper
	// http://jsfiddle.net/vrUgs/2/
	$(".ch_f_r, .ch_m_r").resizable({
		containment: "parent",
		handles: 'n, e, w', // north : intensité de la force
		//ghost: true // ne fonctionne pas avec containment:"parent"
		stop: function(evt,ui)
		{
			var elt = ui.element;
			var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
			poutre.modifier_chargement(elt[0], "Y", pos_x, elt.height(), pos_x+elt.width()); // TODO changement d'axe ; intégrer les chargement affines

			update_defo();
		}
	})

	$(".ch_f_c, .ch_m_c").resizable({
		containment: "parent",
		handles: 'n', // north : intensité de la force
		stop: function(evt,ui)
		{
			var elt = ui.element;
			var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
			poutre.modifier_chargement(elt[0], "Y", pos_x, elt.height()); // TODO changement d'axe ; intégrer les chargement affines

			update_defo();
		}
	})
}
