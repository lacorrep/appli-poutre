// Variable poutre globale
var poutre = new Poutre();


function debug() {
	// Active les outils de débugage
	$("#debug-tools").css("display","block");
}


// onDomReady
$(function(){

// Objet DOM Canvas
glob.canvas = $("#canvas_defo")[0];
// Mise en forme de la zone de dessin
$("#canvas_defo").attr({height: glob.param.canvas_height, width: glob.param.canvas_width})
$("#zone_drop_barre").css({height: glob.param.canvas_height, width: glob.param.canvas_width})
$("#barre").css({height: glob.param.defo_epaisseur, width: glob.param.canvas_width - 2*glob.param.beam_ends_offset})

// Pas de sélection du texte dans le titre ou les menus
$("h1,#menuLiaisons,#menuChargements").disableSelection();

// Explication de ce qu'est un ddl avec la balise abbr
$("ddl").replaceWith('<abbr title="Degré de liberté">ddl</abbr>')


// Drag & drop Liaisons

$(".cl_distributeur").draggable({
	snap: ".cl_instance, .cl_instance", // s’accroche aux autres CL
	snapTolerance: glob.param.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: glob.param.drag_opacity,
	cursor: "move"
})

// Drag & drop Chargements

$(".ch_distributeur").draggable({
	snap: ".cl_instance, .ch_instance", // s’accroche aux autres CL
	snapTolerance: glob.param.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: glob.param.drag_opacity,
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
		if( pos_x < glob.param.beam_ends_offset )
		{
			pos_x = glob.param.beam_ends_offset;
		}
		if( pos_x > glob.param.canvas_width - glob.param.beam_ends_offset )
		{
			pos_x = glob.param.canvas_width - glob.param.beam_ends_offset-3; // TODO décalage arbitraire
		}

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
					poutre.ajouter_chargement(eltDOM, nom_liaison, "Y",
											  pos_x, 0.25*glob.param.canvas_height*glob.param.force_intensity_scale);
					break;
				case "f_r":
				case "m_r":
					// Réparti
					// calculer la largeur de l'élément
					var largeur = ui.draggable.width();
					var eltDOM = $('<span class="ch_instance ch_'+nom_liaison+'" style="left:'+pos_x+'px"></span>')[0];
					$(this).append(eltDOM);
					poutre.ajouter_chargement(eltDOM, nom_liaison, "Y",
											  pos_x, 0.25*glob.param.canvas_height*glob.param.force_intensity_scale,
											  pos_x+largeur, 0.25*glob.param.canvas_height*glob.param.force_intensity_scale);
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
// Vérifier l'isostatisme, recalculer la déformée et l'afficher.
{
	// Vérifier et afficher l'isostaticité
	if( poutre.isostatique() )
	{
		$("#estIso").html("est");
		$("#zone_drop_barre, #canvas_defo").removeClass("frozen");
		// Calculer la déformée
		poutre.compute_defo(glob.canvas);
		// Redessiner la poutre
		poutre.dessiner_defo(glob.canvas);
	}
	else
	{
		$("#estIso").html("n'est pas");
		$("#zone_drop_barre, #canvas_defo").addClass("frozen");
	}
}

function renouveller_interaction()
// Lors de la création de nouveaux éléments, il faut redéfinir les interactions possibles
{
	// Drag & drop
	$(".cl_instance, .ch_instance").draggable({
		snap: ".cl_instance, .ch_instance", // s'accroche aux autres instances
		snapTolerance: glob.param.snapTol,
		opacity: glob.param.drag_opacity,
		cursor: "move",
		stop: function(evt,ui)
		{
			var elt = $(ui.helper[0]);

			// Ne pas traiter les objets en cours de suppression
			if( elt.hasClass("toBeRemoved") ) return;

			var pos_x = traitement_pos_x(elt);

			if( elt.hasClass("ch_f_c") || elt.hasClass("ch_m_c") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x,
					elt.height()*glob.param.force_intensity_scale); // TODO changement d'axe ; intégrer changement d'intensité
				// console.log(poutre.chargements.get(elt[0]).x0); // DEBUG
			}
			if( elt.hasClass("ch_f_r") || elt.hasClass("ch_m_r") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x,
					elt.height()*glob.param.force_intensity_scale, pos_x+elt.width()); // TODO changement d'axe ; intégrer changement d'intensité
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

	// Resize chargements répartis
	// Pour faire un draggable resizable, il faut envelopper dans un div : http://jsfiddle.net/vrUgs/2/
	$(".ch_f_r, .ch_m_r").resizable({
		containment: "parent",
		handles: 'n, e, w', // north : intensité de la force
		//ghost: true // ne fonctionne pas avec containment:"parent"
		stop: function(evt,ui)
		{
			var elt = ui.element;
			var pos_x = traitement_pos_x(elt);
			poutre.modifier_chargement(elt[0], "Y", pos_x,
				elt.height()*glob.param.force_intensity_scale, pos_x+elt.width()); // TODO changement d'axe ; intégrer les chargement affines

			update_defo();
		}
	})
	// Resize chargement concentrés
	$(".ch_f_c, .ch_m_c").resizable({
		containment: "parent",
		handles: 'n', // north : intensité de la force
		stop: function(evt,ui)
		{
			var elt = ui.element;
			var pos_x = traitement_pos_x(elt);
			poutre.modifier_chargement(elt[0], "Y", pos_x,
				elt.height()*glob.param.force_intensity_scale); // TODO changement d'axe ; intégrer les chargement affines

			update_defo();
		}
	})

	// Double-clic (jQuery standard)
	$( ".ch_instance" ).dblclick(function(handle) {
		console.log( "Double-clic !" );
		// var elt = $(handle.target);
		// var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
		// poutre.modifier_chargement(elt[0], "Y", pos_x,
		// 	-elt.height()*glob.param.force_intensity_scale); // TODO changement d'axe ; intégrer les chargement affines
		// update_defo();
	});
}

function traitement_pos_x(elt)
// Calcule pos_x et empêche d'avoir des éléments qui dépassent de la poutre.
// var pos_x = traitement_pos_x(elt);
{
	var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );

	if( pos_x < glob.param.beam_ends_offset )
	{
		pos_x = glob.param.beam_ends_offset;
	}
	if( pos_x > glob.param.canvas_width - glob.param.beam_ends_offset )
	{
		pos_x = glob.param.canvas_width - glob.param.beam_ends_offset;
	}

	return pos_x;
}