// Bibliothèque de classes pour gérer la résistance des matériaux dans cette application

function Liaison(objDOM, type, axe, position)
// Représente une liaison mécanique (condition aux limites de type cinématique).
// objDOM <objet du DOM> : l'objet du DOM associé à la liaison
// type <String> : "appui", "pivot", "encastrement"
// axe <String> : "X" ou "Y"
// position <Number> : position en pixels de la liaison dans la zone de dessin
{
	position -= glob.beam_ends_offset;

	this.objDOM = objDOM;
	this.x = position;

	// Définition du type de liaison
	this.type = type;
	switch( this.type )
	{
		case "appui":
			this.axe = axe;
			if(this.axe === "X")
				this.bloque = [true, false, false]; // bloque U
			else if(this.axe === "Y")
				this.bloque = [false, true, false]; // bloque V
			else
				alert("Erreur : axe de liaison inconnu.")
			break;

		case "pivot":
			this.bloque = [true, true, false]; // bloque U, V
			break;

		case "encastrement":
			this.bloque = [true, true, true]; // bloque U, V, THETA
			break;
		default:
			alert("Erreur : type de liaison inconnu.")
	}
	//this.reaction = [undefined,undefined,undefined]; // TODO
}

function Chargement(objDOM, type, axe, x0, f0, x1, f1)
// Représente un chargement mécanique (condition aux limites de type sthénique).
// objDOM <objet du DOM> : l'objet du DOM associé au chargement
// type <String> : "f_c" (force concentrée), "f_r" (force répartie), "m_c" (moment concentré), "m_r" (moment réparti)
// axe <String> : "X" ou "Y"
// x0 <Number> : position en pixels du premier point d'application de l'effort dans la zone de dessin
// f0 <Number> : intensité de la force en x0
// x1 <Number> optionnel : position en pixels de la fin de l'effort la zone de dessin
// f1 <Number> optionnel : intensité de la force en x1 // TODO
{
	// NB : x0 < x1 car jQuery UI ne le permet pas autrement
	x0 -= glob.beam_ends_offset;
	x1 -= glob.beam_ends_offset;

	this.objDOM = objDOM;
	this.type = type;
	if( axe !== "X" && axe !== "Y" )
	{
		alert("Erreur : axe de chargement inconnu.")
		return -1
	}
	this.axe = axe; // "X" "Y"
	this.x0 = x0;
	this.f0 = f0;
	this.x1 = x1 || x0; // optionnel
	this.f1 = f1 || f0; // optionnel
}

function Poutre()
// Représente une poutre.
{
	var self = this; // règle certains problèmes lorsqu'on manipule des variables dans des "fonctions dans des fonctions" (qu'on appelle des "méthodes")

	self.ES = 100; // raideur en traction / compression
	self.EI = 10; // raideur en flexion

	// Grandeurs cinématiques (tableaux de nombres)
	self.u = []; // déplacement
	self.v = []; // flèche
	self.theta = []; // angle de la section = dérivée de la flèche (Bernoulli)

	// Efforts intérieurs (tableaux de nombres)
	self.effort_N = []; // effort intérieur normal
	self.effort_T = []; // effort intérieur tranchant
	self.effort_M = []; // moment fléchissant

	// Map d'objets Liaison et Chargements
	self.liaisons = new Map();
	self.chargements = new Map();

	// Stockage des efforts de liaison une fois calculés pour pouvoir les dessiner
	self.reactions = [];
	self.x_R_flex = [];
	self.type_R_flex = [];

	self.isostatique = function()
	// Renvoie true si la structure est isostatique, false sinon.
	{
		var NB_CL_u = 0; // nombre de CL sur u
		var NB_CL_v_ou_theta = 0; // nombre de CL sur v ou theta
		for(var liaison of self.liaisons.values())
		{
			if( liaison.bloque[0] ) NB_CL_u += 1;
			if( liaison.bloque[1] ) NB_CL_v_ou_theta += 1;
			if( liaison.bloque[2] ) NB_CL_v_ou_theta += 1;
		}

		return ( NB_CL_u == 1 && NB_CL_v_ou_theta == 2 )
	}

	self.ajouter_liaison = function(objDOM, type, axe, x)
	// Ajoute une liaison sur la poutre
	{
		self.liaisons.set( objDOM, new Liaison(objDOM, type, axe, x) )
	}

	self.modifier_liaison = function(objDOM, axe, x)
	// Déplace une liaison sur la poutre
	{
		x -= glob.beam_ends_offset;
		
		self.liaisons.get( objDOM ).axe = axe;
		self.liaisons.get( objDOM ).x = x;

		// console.log( self.liaisons.get( objDOM ) )
	}

	self.retirer_liaison = function(objDOM)
	// Retire une liaison sur la poutre
	{
		self.liaisons.delete( objDOM )
	}

	self.ajouter_chargement = function(objDOM, type, axe, x0, f0, x1, f1)
	// Ajoute un chargement sur la poutre
	{
		// apparemment ça ne bug pas quand on ne fournit pas x1 et f1
		self.chargements.set( objDOM, new Chargement(objDOM, type, axe, x0, f0, x1, f1) ) // TODO x1 f1

		// alert("ajouter_chargement appelé") // DEBUG
	}

	self.modifier_chargement = function(objDOM, axe, x0, f0, x1, f1)
	// Modifie un chargement de la poutre
	{
		x0 -= glob.beam_ends_offset;
		x1 -= glob.beam_ends_offset;

		self.chargements.get( objDOM ).axe = axe;
		self.chargements.get( objDOM ).x0 = x0;
		self.chargements.get( objDOM ).f0 = f0;
		self.chargements.get( objDOM ).x1 = x1 || x0;
		self.chargements.get( objDOM ).f1 = f1 || f0;

		// console.log("debug : chargement modifié") // DEBUG
		// console.log(self.chargements.get(objDOM));
	}

	self.retirer_chargement = function(objDOM)
	// Retire un chargement sur la poutre
	{
		self.chargements.delete( objDOM )

		// alert("retirer_chargement appelé") // DEBUG
	}

	self.compute_defo = function(canvas)
	// Calcule les déformées et les stock dans self.
	{
		console.log(" # ====== UPDATE_DEF ========");

		var nx = canvas.width - 2*glob.beam_ends_offset; // nombre de points du domaine
		var Dx = 1/9; // 9 car c'est la largeur en pixels d'une force concentrée. Devient l'unité de longueur par défaut.

		if( !self.isostatique() )
		{
			console.log("Poutre.compute_defo : non isostatique")

			return 0
		}

		if( self.chargements.size === 0 ) // aucun chargement sur la poutre
		{
			// Aucun effort, rien ne se passe. Déformée nulle.
			for (var i = 0; i < nx; i++) {
				self.effort_N[i] = 0;
				self.effort_T[i] = 0;
				self.effort_M[i] = 0;
				self.u[i] = 0;
				self.v[i] = 0;
				self.theta[i] = 0;
			};
			self.reactions = [];
			return 1
		}

		//////////////////// Calculer les vecteurs de sollicitations ////////////////////

		// Échelles des forces
		// le calcul n'est pas optimisé pour bien montrer quelles sont les opérations géométriques effectuées.
		// un bloc de hauteur H/4 correspond à 100% d'une unité sur l'échelle
		var F_c_scale = 1/(glob.canvas.height/4) * glob.force_intensity_scale;
		var F_r_scale = 1/(glob.canvas.height/4) * glob.force_intensity_scale * Dx; 
		var M_c_scale = 1/(glob.canvas.height/4) * glob.moment_intensity_scale;
		var M_r_scale = 1/(glob.canvas.height/4) * glob.moment_intensity_scale * Dx;

		// Tableaux des efforts extérieurs appliqués sur chaque noeud
		// FX(i) est la valeur de la force exercée par l'extérieur sur le point numéro i de la poutre
		FX = [];
		FY = [];
		M  = [];
		// Initialisation
		for (var i = 0; i < nx; i++) {
			FX[i] = 0;
			FY[i] = 0;
			M[i]  = 0;
		};
		for(var chargement of self.chargements.values())
		{
			// console.log(chargement); // DEBUG
			switch( chargement.type )
			{
				case "f_c":
					if( chargement.axe === "X" )
						FX[chargement.x0] += chargement.f0 * F_c_scale;
					else // Y
						FY[chargement.x0] += chargement.f0 * F_c_scale;
					break;

				case "f_r":/**/
					if( chargement.axe === "X" )
					{
						for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
							FX[xi] += chargement.f0 * F_r_scale; // TODO interpolation entre f0 et f1
					}
					else // Y
					{
						for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
							FY[xi] += chargement.f0 * F_r_scale; // TODO interpolation
					}
					break;

				case "m_c":
					M[chargement.x0] += chargement.f0 * M_c_scale;
					break;

				case "m_r":
					for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
						M[xi] += chargement.f0 * M_r_scale; // TODO interpolation
					break;
				default:
					console.error("Poutre.compute_defo : type de chargment " + chargement.type + " inconnu.");
			}
		}

		//////////////////// PFS ////////////////////

		// Somme des forces : FX.sum() et FY.sum() (calculé plus loin)

		// Somme des moments (calculés au point tout à gauche de la poutre)
		M_A = 0;
		for (var i = 0; i < nx; i++)
		{
			M_A += FY[i] * i*Dx; // force * bras de levier (<- efforts appliqués à gauche des tronçons, 1px = 1 tronçon)
		}
		// Moments purs
		M_A += M.sum(); // somme des moments concentrés et répartis

		// Vecteur des résultantes extérieures
		var F_ext = [FX.sum(),FY.sum(), M_A]; // Fx, Fy, M_A

		// Calcule les efforts aux liaisons (traction/compression et flexion découplées)
		var R0, x_R0; // réaction et postion de la liaison pour la traction-compression
		var x_R_flex = []; // position des efforts de liaison pour la flexion
		var type_R_flex = []; // type des efforts de liaison pour la flexion
		var C = [[],[]]; // coefficients du système à résoudre pour l'équilibre de la poutre en flexion
		for (var liaison of self.liaisons.values())
		{
			if( liaison.bloque[0] )
			{
				// C'est la liaison bloquante horizontale (il n'y en a qu'une car poutre isostatique)
				R0 = - F_ext[0];
				x_R0 = liaison.x;
			}
			if( liaison.bloque[1] )
			{
				// On a un effort vertical, on le stocke
				x_R_flex.push( liaison.x )
				type_R_flex.push( "force" )
				C[0].push(1)
				C[1].push(liaison.x*Dx) // attention à bien convertir en mètres : *Dx
			}
			if( liaison.bloque[2] )
			{
				// On a un moment, on le stocke
				x_R_flex.push( liaison.x )
				type_R_flex.push( "moment" )
				C[0].push(0)
				C[1].push(1)
			}
		}
		// On connaît tous les efforts de flexion : résolution
		var detM = C[0][0]*C[1][1] - C[1][0]*C[0][1]; // OK
		if( Math.abs(detM) < 1e-5 ) {
			alert("PFS : déterminant nul ! ")
			return
		}
		var R1 = ( F_ext[2]*C[0][1] - F_ext[1]*C[1][1] ) / detM;
		var R2 = ( F_ext[1]*C[1][0] - F_ext[2]*C[0][0] ) / detM;
		// R1 est de type type_R_flex[0], R2 est de type type_R_flex[1]

		// DEBUG
		// console.log(C)
		// console.log("=== Valeurs des efforts de liaison R1 R2")
		// console.log([R1, R2])
		// console.log("=== Types d'effort R1 R2")
		// console.log([type_R_flex[0], type_R_flex[1]])
		// console.log("=== Position des efforts R1 R2")
		// console.log([x_R_flex[0], x_R_flex[1]])
		console.log("R1 : "+type_R_flex[0]+", intensité "+R1+" en x = "+x_R_flex[0]);
		console.log("R2 : "+type_R_flex[1]+", intensité "+R2+" en x = "+x_R_flex[1]);



		// On a tous les efforts extérieurs (chargement + liaisons) :
		// on peut déterminer les efforts intérieurs par coupure


		//////////////////// Efforts intérieurs ////////////////////

		// Réinitialisation des efforts intérieurs
		self.effort_N = [];
		self.effort_T = [];
		self.effort_M = [];
		// Initialisation des sommes
		var S_N = 0;
		var S_T = 0;
		for (var i = nx-1; i >= 0; i--) {
			// Calcul de N (effort intérieur normal)
			if( i === x_R0 ) S_N += R0;
			S_N += FX[i];
			self.effort_N[i] = S_N;

			// Calcul de T (effort intérieur tranchant)
			if( i === x_R_flex[0] && type_R_flex[0] === "force" ) { S_T += R1; }
			if( i === x_R_flex[1] && type_R_flex[1] === "force" ) { S_T += R2; }
			S_T += FY[i];
			self.effort_T[i] = S_T;
		}

		// Intégration de l'effort tranchant
		// M' = -T
		// de plus [[M]] + C = 0 => M+ = M- - C // il faut donc soustraire les moments concentrés
		var S_M = 0;
		for (var i = 0; i < nx; i++) {
			// Calcul de M (moment fléchissant)
			if( i === x_R_flex[0] && type_R_flex[0] === "moment" ) { S_M -= R1; }
			if( i === x_R_flex[1] && type_R_flex[1] === "moment" ) { S_M -= R2; }
			// Intégration de l'effort tranchant et ajout des moments purs
			S_M += arrondir( -M[i] - self.effort_T[i] * Dx , 3);
			self.effort_M[i] = S_M;
		}
		//  il faut intégrer T de droite à gauche et cumuler M de droite à gauche.


		//////////////////// Calcul de la déformée ////////////////////

		// Horizontale : on intègre epsilon = N/ES
		self.u = [];
		var S_u = 0;
		for (var i = 0; i < nx; i++) {
			S_u += self.effort_N[i] / self.ES;
			self.u.push( S_u );
		}
		// On impose fortement la CL sur u : u(x_R0) = 0
		var u_x_R0 = self.u[x_R0];
		for (var i = 0; i < nx; i++)
			self.u[i] -= u_x_R0;

		// Verticale : on intègre deux fois v'' = Mf/EI
		// Première intégration (v'' -> v')
		self.v = [];
		self.theta = [];
		var S_theta = 0;
		for (var i = 0; i < nx; i++) {
			S_theta += self.effort_M[i] * Dx / self.EI;
			self.theta.push( S_theta );
		}

		// On impose fortement v'(x_encastrement) = 0
		var angle_a_soustraire = 0;
		if( type_R_flex[0] === "moment" ) { angle_a_soustraire = self.theta[x_R_flex[0]]; }
		else if( type_R_flex[1] === "moment" ) { angle_a_soustraire = self.theta[x_R_flex[1]]; }
		for (var i = 0; i < nx; i++)
			self.theta[i] -= angle_a_soustraire;

		// Seconde intégration (v' -> v)
		var S_v = 0;
		for (var i = 0; i < nx; i++) {
			S_v += self.theta[i]*Dx;
			// console.log(1e7 * self.theta[i]*Dx); // DEBUG
			self.v.push( S_v );
		}

		// On impose fortement la CL sur v : v=0 en x_R_flex[0] et x_R_flex[1]
		// La solution sans CL est définie à une droite près, on soustrait cette droite pour annuler v sur les liaisons.
		// ATTENTION : ici ça fonctionne parce que la seule liaison capable d'imposer une pente nulle, c'est l'encastrement qui impose également une flèche nulle.
		if( type_R_flex[0] === "force" && type_R_flex[1] === "force" ) {
			// droite
			var v_x_R1 = self.v[ x_R_flex[0] ];
			var v_x_R2 = self.v[ x_R_flex[1] ];

			// if( Math.abs( x_R_flex[1]-x_R_flex[0] ) > 1e-4 ) // TODO précision à ajuster et à exprimer en fonction de nx
			var pente = (v_x_R2-v_x_R1)/(x_R_flex[1]-x_R_flex[0]);

			console.log("Pente " + pente);

			for (var i = 0; i < nx; i++)
				self.v[i] -= pente*( i - x_R_flex[0] ) + v_x_R1; // forme paramétrique
		}
		else
		{
			// constante
			var deplacement_a_soustraire = 0;
			if( type_R_flex[0] === "force" ) deplacement_a_soustraire = self.v[ x_R_flex[0] ];
			if( type_R_flex[1] === "force" ) deplacement_a_soustraire = self.v[ x_R_flex[1] ];

			console.log("Déplacement v à soustraire " + deplacement_a_soustraire);

			for (var i = 0; i < nx; i++)
				self.v[i] -= deplacement_a_soustraire;
		}

		// Stockage pour pouvoir tracer les efforts de liaison correctement
		self.reactions = [R1, R2]; // inconnues de liaison
		self.x_R_flex = x_R_flex;
		self.type_R_flex = type_R_flex;

		console.log(" # ====== FIN UPDATE_DEF ========");
		return 1
	}

	self.dessiner_defo = function(canvas)
	{
		var ctx = canvas.getContext("2d");
		var W = canvas.width;
		var H = canvas.height;
		ctx.clearRect(0,0, W,H);

		// Style du trait et dessin
		ctx.strokeStyle = "black";
		ctx.lineWidth = glob.defo_epaisseur;

		// Amplitudes
		if( glob.amplitude_fixee )
		{
			var amp_u = glob.amp_u;
			var amp_v = glob.amp_v;
		}
		else
		{
			var amp_u = 0.01; // 1 / self.u.abs().max() * W/2 * glob.amp_max_defo; // TODO selon la marge
			var amp_v = 1 / self.v.abs().max() * H/2 * glob.amp_max_defo;
			if( !isFinite(amp_v) ) amp_v = 0; // dessiner une poutre plate si l'ampitude est infinie
			// Limiteur d'échelle
			amp_v = Math.min(amp_v,3e3); // TODO limite arbitraire

			console.log("amp_v " + amp_v);

			// Mise à jour de l'objet global
			glob.amp_u = amp_u;
			glob.amp_v = amp_v;
		}

		// Définition du tracé
		ctx.beginPath();
		ctx.moveTo(glob.beam_ends_offset + self.u[0] * amp_u, H/2 - self.v[0] * amp_v);
		for (var i = 1; i < self.v.length; i++) {
			ctx.lineTo(glob.beam_ends_offset + i + self.u[i] * amp_u, H/2 - self.v[i] * amp_v );
		};

		// Dessin
		ctx.stroke();

		// Dessin des sections
		if( glob.showSections )
		{
			ctx.lineWidth = glob.defo_epaisseur/2;
			ctx.strokeStyle = "rgba(150,150,255,0.8)";
			for (var j = 0; j < glob.number_of_sections; j++ )
			{
				var i = Math.floor( j * (glob.canvas_width-2*glob.beam_ends_offset)/(glob.number_of_sections-1) );
				if( i > self.u.length-2 ) i = self.u.length-2;
				var x = glob.beam_ends_offset + self.u[i] * amp_u + i;
				var y = H/2 - self.v[i] * amp_v;

				// Calcul de l'angle
				// On ne peut pas utiliser self.theta car le coefficient matériau EI n'a pas de sens (je crois que c'est ça)
				var angle = Math.atan2( (H/2 - self.v[i+1] * amp_v) - (H/2 - self.v[i] * amp_v) ,
							(glob.beam_ends_offset + self.u[i+1] * amp_u + i+1) - (glob.beam_ends_offset + self.u[i] * amp_u + i));

				ctx.beginPath();
				ctx.moveTo(x + glob.section_lowest_y*Math.sin(angle),  y - glob.section_lowest_y*Math.cos(angle) );
				ctx.lineTo(x + glob.section_highest_y*Math.sin(angle), y - glob.section_highest_y*Math.cos(angle) );
				ctx.stroke();
			}
		}
	}

	self.dessiner_efforts_internes = function(canvas,type)
	{
		var ctx = canvas.getContext("2d");
		var W = canvas.width;
		var H = canvas.height;
		ctx.clearRect(0,0, W,H);

		// Choix de l'effort
		switch(type)
		{
			case "N":
				var effort = self.effort_N;
				var amp_fixee = glob.amp_N;
				break;
			case "T":
				var effort = self.effort_T;
				var amp_fixee = glob.amp_T;
				break;
			case "M":
				var effort = self.effort_M;
				var amp_fixee = glob.amp_M;
				break;
			default:
				console.error("Type d'effort non reconnu (rdm.js : Poutre.dessin_effort) (1)")
		}

		// Amplitudes
		if( glob.amplitude_fixee )
		{
			var amp = amp_fixee;
		}
		else
		{
			var amp = 1 / effort.abs().max() * H/2 * glob.amp_max_effort;
			if( !isFinite(amp) ) amp = 0; // dessiner une poutre plate si l'ampitude est infinie
			// Limiteur d'échelle
			amp = Math.min(amp,3e3); // TODO limite arbitraire

			console.log("amp_"+type+" " + amp);

			// Mise à jour de l'objet global
			switch(type)
			{
				case "N":
					glob.amp_N = amp;
					break;
				case "T":
					glob.amp_T = amp;
					break;
				case "M":
					glob.amp_M = amp;
					break;
				default:
					console.error("Type d'effort non reconnu (rdm.js : Poutre.dessin_effort) (2)")
			}
		}

		// Définition du tracé
		ctx.beginPath()
		ctx.moveTo(glob.beam_ends_offset/(glob.canvas.width/canvas.width), H/2 - effort[0] * amp);
		for (var i = 1; i < effort.length; i++) {
			ctx.lineTo((glob.beam_ends_offset + i)/(glob.canvas.width/canvas.width), H/2 - effort[i] * amp );
		};

		// Style du trait et dessin
		switch(type)
		{
			case "N":
				ctx.strokeStyle = "red";
				break;
			case "T":
				ctx.strokeStyle = "green";
				break;
			case "M":
				ctx.strokeStyle = "blue";
				break;
			default:
				console.error("Type d'effort non reconnu (rdm.js : Poutre.dessin_effort) (3)")
		}
		
		ctx.lineWidth = glob.defo_epaisseur;

		// Tracer
		ctx.stroke();
	}

	self.dessiner_efforts_liaisons = function(canvas)
	{
		if( self.reactions.length < 1 ) return; // on arrête tout s'il n'y a pas d'efforts de réaction

		var ctx = canvas.getContext("2d");

		var H = canvas.height;
		
		ctx.strokeStyle = "rgba(255,0,255,0.3)";

		var amp_force = (glob.canvas.height/4) / glob.force_intensity_scale;
		var amp_moments = (glob.canvas.height/4) / glob.moment_intensity_scale / 5;

		for(var i = 0; i <= 1; i++)
		{
			var X = glob.beam_ends_offset + self.x_R_flex[i];
			if(self.type_R_flex[i] === "force")
			{
				var intensite = amp_force*self.reactions[i];
				if( Math.abs(intensite) > 0.9*glob.canvas.height/2 )
				{
					ctx.lineWidth = glob.defo_epaisseur*(1+2*Math.log( Math.abs(intensite)/(0.9*glob.canvas.height/2) ) );
					intensite = Math.sign(intensite)*0.9*glob.canvas.height/2;
				}
				else
				{
					ctx.lineWidth = glob.defo_epaisseur;
				}
				ctx.beginPath();
				canvas_arrow(ctx, X,H/2, X,H/2-intensite); // longueur de la flèche 0.6*Math.abs(self.reactions[i])
				ctx.stroke();
			}
			else if( self.type_R_flex[i] === "moment" )
			{
				// ATTENTION ! LES ANGLES DOIVENT ÊTRE DONNÉS DANS LE SENS OPPOSÉ
				var rayon = Math.abs(amp_moments*self.reactions[i]);
				if( rayon > 0.9*glob.canvas.height/2 )
				{
					ctx.lineWidth = glob.defo_epaisseur*(1+2*Math.log( rayon/(0.9*glob.canvas.height/2) ) );
					rayon = 0.9*glob.canvas.height/2;
				}
				else
				{
					ctx.lineWidth = glob.defo_epaisseur;
				}
				ctx.beginPath();
				if( self.reactions[i] <= 0 )
				{
					ctx.arc(X, H/2, rayon, 1.3*Math.PI/2, 0);
					canvas_arrow(ctx, X+rayon,H/2-1, X+rayon,H/2+5);
				}
				else
				{
					ctx.arc(X, H/2, rayon, Math.PI,-3.3*Math.PI/2);
					canvas_arrow(ctx, X-rayon,H/2-1, X-rayon,H/2+5);
				}
				ctx.stroke();
			}
			else
			{
				console.warn("DEBUG (rdm.js : Poutre.dessiner_efforts_liaisons) type d'effort inconnu : "
					+ self.type_R_flex[i] + " (se produit lorsqu'il n'y a pas encore de forces)")
			}

		}
	}
}

function arrondir(nombre, n_decimale)
// Arrondi à la n-ième décimale.
// nombre <Number> : nombre à arrondir
// n_decimale <Number> : décimale à laquelle arrondir
{
	var puissance = Math.pow(10,n_decimale);
	return Math.round(nombre*puissance)/puissance;
}