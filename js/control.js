// Variable poutre globale
var poutre = new Poutre();


function set_beam_frame()
// Mise en forme de la zone de dessin
{
	var window_Width = $(window).width();

	// Si on manque de place, réduire
	if( window_Width <  1000 ) {
		// Petit
		glob.canvas_ratio_width = 0.95;
		glob.beam_ends_offset = 8;
		glob.canvas_ratio_height = 0.50;
		$( "#dialog-info" ).dialog({minWidth: 300});
	}
	else
	{
		// Grand
		glob.canvas_ratio_width = 0.5;
		glob.beam_ends_offset = 30;
		glob.canvas_ratio_height = 0.40;
		$( "#dialog-info" ).dialog({minWidth: 600});
	}
	$( "#dialog-info" ).dialog("close");

	// Taille du canvas
	glob.canvas_width = Math.round( glob.canvas_ratio_width * window_Width );
	glob.canvas_height = Math.round( glob.canvas_ratio_height * glob.canvas_width );

	$("#canvas_defo").attr({width: glob.canvas_width, height: glob.canvas_height})
	$("#zone_drop_barre").css({width: glob.canvas_width, height: glob.canvas_height})
	$("#barre").css({width: glob.canvas_width - 2*glob.beam_ends_offset, height: glob.defo_epaisseur})
	$("#canvas_effort_N").attr({width: glob.canvas_width, height: 0.4*glob.canvas_height})
	$("#canvas_effort_T").attr({width: glob.canvas_width, height: 0.4*glob.canvas_height})
	$("#canvas_effort_M").attr({width: glob.canvas_width, height: 0.4*glob.canvas_height})

	// Bords de lignes arrondis
	var ctx = glob.canvas.getContext("2d"); ctx.lineCap = 'round';
}

// Fonction qui gère le redimensionnement de la fenêtre (inutile pour la majorité des utilisateurs)
// window.addEventListener("resize",set_beam_frame); // ATTENTION ! change la taille du canvas mais pas la position des chargements / CL


// onDomReady (attendre le chargement des éléments de la page)
$(function(){

// Objet DOM Canvas
glob.canvas = $("#canvas_defo")[0];
glob.canvas_effort_N = $("#canvas_effort_N")[0];
glob.canvas_effort_T = $("#canvas_effort_T")[0];
glob.canvas_effort_M = $("#canvas_effort_M")[0];

// Ajuster les éléments de la page
set_beam_frame();

// Pas de sélection du texte dans le titre ou les menus
$("h1,#menuLiaisons,#menuChargements,label").disableSelection();

// Explication de ce qu'est un ddl avec la balise abbr
$("ddl").replaceWith('<abbr title="Degré de liberté">ddl</abbr>')


// Drag & drop Liaisons

$(".cl_distributeur").draggable({ // TODO les objets dragged ne s'affichent pas au-dessus du canvas
	// snap: ".cl_instance, .cl_instance", // s’accroche aux autres CL
	// snapTolerance: glob.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: glob.drag_opacity,
	cursor: "move"
})

// Drag & drop Chargements

$(".ch_distributeur").draggable({ // TODO les objets dragged ne s'affichent pas au-dessus du canvas
	// snap: ".cl_instance, .ch_instance", // s’accroche aux autres CL
	// snapTolerance: glob.snapTol,
	revert: true,
	revertDuration: 100,
	opacity: glob.drag_opacity,
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

		var pos_x = traitement_pos_x(ui.draggable);

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
					console.error("control.js $(\"#zone_drop_barre\").droppable : Liaison de type inconnu");
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
											  pos_x, glob.canvas_height/4);
					break;
				case "f_r":
				case "m_r":
					// Réparti
					// calculer la largeur de l'élément
					var largeur = ui.draggable.width();
					var eltDOM = $('<span class="ch_instance ch_'+nom_liaison+'" style="left:'+pos_x+'px"></span>')[0];
					$(this).append(eltDOM);
					poutre.ajouter_chargement(eltDOM, nom_liaison, "Y",
											  pos_x, glob.canvas_height/4,
											  pos_x+largeur, glob.canvas_height/4);
					break;
				default:
					console.error("control.js $(\"#zone_drop_barre\").droppable : Chargement de type inconnu");
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
		// Dessiner les inconnues de liaison
		if( glob.showLinkingReactions ) poutre.dessiner_efforts_liaisons(glob.canvas);
		// Canvas avec les efforts internes
		poutre.dessiner_efforts_internes(glob.canvas_effort_N,"N");
		poutre.dessiner_efforts_internes(glob.canvas_effort_T,"T");
		poutre.dessiner_efforts_internes(glob.canvas_effort_M,"M");
	}
	else
	{
		// Pas isostatique
		$("#estIso").html("n'est pas");
		$("#zone_drop_barre, #canvas_defo").addClass("frozen");
		var ctx = glob.canvas.getContext("2d"); ctx.clearRect(0,0, glob.canvas_width,glob.canvas_height);
		ctx = glob.canvas_effort_N.getContext("2d"); ctx.clearRect(0,0, glob.canvas_width,0.4*glob.canvas_height);
		ctx = glob.canvas_effort_T.getContext("2d"); ctx.clearRect(0,0, glob.canvas_width,0.4*glob.canvas_height);
		ctx = glob.canvas_effort_M.getContext("2d"); ctx.clearRect(0,0, glob.canvas_width,0.4*glob.canvas_height);
	}
}

function renouveller_interaction()
// Lors de la création de nouveaux éléments, il faut redéfinir les interactions possibles
{
	// Drag & drop
	$(".cl_instance, .ch_instance").draggable({
		// snap: ".cl_instance, .ch_instance", // s'accroche aux autres instances
		// snapTolerance: glob.snapTol,
		opacity: glob.drag_opacity,
		cursor: "move",
		stop: function(evt,ui)
		{
			var elt = $(ui.helper[0]);

			// If the .ch_instance is flipped (has the class .flipped), the force is downward
			var downward = elt.hasClass("flipped") ? -1 : 1;

			// Ne pas traiter les objets en cours de suppression
			if( elt.hasClass("toBeRemoved") ) return;

			var pos_x = traitement_pos_x(elt);

			if( elt.hasClass("ch_f_c") || elt.hasClass("ch_m_c") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x,
					downward*elt.height()); // TODO changement d'axe ; intégrer changement d'intensité
				// console.log(poutre.chargements.get(elt[0]).x0); // DEBUG
			}
			if( elt.hasClass("ch_f_r") || elt.hasClass("ch_m_r") )
			{
				poutre.modifier_chargement(elt[0], "Y", pos_x,
					downward*elt.height(), pos_x+elt.width()); // TODO changement d'axe ; intégrer changement d'intensité
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
		//ghost: true // incompatible avec containment:"parent"
		stop: function(evt,ui)
		{
			var elt = ui.element;
			// If the .ch_instance is flipped (has the class .flipped), the force is downward
			var downward = elt.hasClass("flipped") ? -1 : 1;
			var pos_x = traitement_pos_x(elt);
			poutre.modifier_chargement(elt[0], "Y", pos_x,
				downward*elt.height(), pos_x+elt.width()); // TODO changement d'axe ; intégrer les chargement affines

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
			// If the .ch_instance is flipped (has the class .flipped), the force is downward
			var downward = elt.hasClass("flipped") ? -1 : 1;
			var pos_x = traitement_pos_x(elt);
			poutre.modifier_chargement(elt[0], "Y", pos_x,
				downward*elt.height()); // TODO changement d'axe ; intégrer les chargement affines

			update_defo();
		}
	})

	// SUR MOBILE : pression longue
	if( isMobile )
	{	
		$('.ch_instance').longpress(function(e) {
			e.preventDefault();
			var elt = $(e.target);
			var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
			// Flip the arrow (assigne la classe "flipped" à l'objet s'il ne l'a pas ; et retire la classe si l'objet la possède)
			elt.toggleClass("flipped");
			// If flipped, the force is downward
			var downward = elt.hasClass("flipped") ? -1 : 1;
			poutre.modifier_chargement(elt[0], "Y", pos_x,
					downward*elt.height(), pos_x+elt.width()); // TODO changement d'axe ; implémenter/intégrer? les chargement affines

			console.log("TRIGGERED LONG PRESS");
			update_defo();
		}, function(e){
			// short click
			return
		});
	}
	else
	{
		// Double-clic (jQuery standard)
		$( ".ch_instance" ).dblclick(function(handle) {
			handle.preventDefault();
			var elt = $(handle.target);
			var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );
			// Flip the arrow (assigne la classe "flipped" à l'objet s'il ne l'a pas ; et retire la classe si l'objet la possède)
			elt.toggleClass("flipped");
			// If flipped, the force is downward
			var downward = elt.hasClass("flipped") ? -1 : 1;
			poutre.modifier_chargement(elt[0], "Y", pos_x,
					downward*elt.height(), pos_x+elt.width()); // TODO changement d'axe ; implémenter/intégrer? les chargement affines

			update_defo();
		});
	}
}

function traitement_pos_x(elt)
// Calcule pos_x et empêche d'avoir des éléments qui dépassent de la poutre.
// var pos_x = traitement_pos_x(elt);
{
	var pos_x = Math.floor( elt.offset().left - $("#zone_drop_barre").offset().left );

	if( pos_x < glob.beam_ends_offset )
	{
		pos_x = glob.beam_ends_offset;
	}
	if( pos_x > glob.canvas_width - glob.beam_ends_offset )
	{
		pos_x = glob.canvas_width - glob.beam_ends_offset-3; // TODO le décalage de -3 est arbitraire. dû à la largeur du contour ?
	}

	// Clipser les efforts sur les liaisons
	// TODO

	for(var liaison of poutre.liaisons.values())
	{
		console.log("==============================");
		console.log("liaison.x    " + (liaison.x) );
		console.log("pos_x   " + (pos_x) );
		console.log("==============================");
		if( Math.abs( liaison.x + glob.beam_ends_offset - pos_x ) < 2*glob.snapTol )
		{
			console.warn("CLIPS !");
			pos_x = liaison.x + glob.beam_ends_offset; // fonctionne pour les chargements concentrés // TODO à améliorer (brouillon)
		}
	}

	return pos_x;
}