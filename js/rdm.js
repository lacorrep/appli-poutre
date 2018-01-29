// TODO : gérer les positions x, x0, x1 en pixels correctement (offset avec le bord) !!!
// TODO : a priori l'attribut objDOM de Liaison et Chargement n'est pas nécessaire, les données de l'interface sont lues mais jamais écrites (pas de contrôle de la vue par rdm.js)
// TODO : déterminer f1 pour les chargements répartis

// TODO : gérer le problème de flexion indépendamment de la traction/compression si les CL le permettent ?

function Liaison(objDOM, type, axe, position)
// Objet simple contenant un objet du DOM <objet DOM>,
// un nom de type <String> et une position <Number en px>
{
	position -= gui.options.beam_ends_offset;

	this.objDOM = objDOM;
	this.x = position;

	// Définition du type de liaison
	this.type = type;
	switch( this.type )
	{
		case "appui":
			this.axe = axe;
			if(this.axe === "X")
				this.bloque = [true, false, false]; // U
			else if(this.axe === "Y")
				this.bloque = [false, true, false]; // V
			else
				alert("Erreur : axe de liaison inconnu.")
			break;

		case "pivot":
			this.bloque = [true, true, false]; // U, V
			break;

		case "encastrement":
			this.bloque = [true, true, true]; // U, V, THETA
			break;
		default:
			alert("Erreur : type de liaison inconnu.")
	}
	this.reaction = [undefined,undefined,undefined]; // réaction à calculer
}

function Chargement(objDOM, type, axe, x0, f0, x1, f1)
// Objet simple contenant un objet du DOM <objet DOM>,
// un nom de type <String>, les positions de début et de fin
// (x1 optionnel, seulement si effort réparti) <Number en px>,
// la valeur de la force <Number>
{
	x0 -= gui.options.beam_ends_offset;
	x1 -= gui.options.beam_ends_offset;

	this.objDOM = objDOM;
	this.type = type; // types possibles : f_c | f_r | m_c | m_r
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

	// NB : x0 < x1 car jQuery UI ne le permet pas autrement
}

function Poutre()
{
	var self = this;

	self.ES = 1;
	self.EI = 10;

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

		// alert( self.isostatique() ? "Isostatique" : "Non isostatique" ) // DEBUG
	}

	self.modifier_liaison = function(objDOM, axe, x)
	// Déplace une liaison sur la poutre
	{
		x -= gui.options.beam_ends_offset;
		
		self.liaisons.get( objDOM ).axe = axe;
		self.liaisons.get( objDOM ).x = x;

		// alert( self.isostatique() ? "Isostatique" : "Non isostatique" ) // DEBUG
		// console.log( self.liaisons.get( objDOM ) )
	}

	self.retirer_liaison = function(objDOM)
	// Retire une liaison sur la poutre
	{
		self.liaisons.delete( objDOM )

		// alert( self.isostatique() ? "Isostatique" : "Non isostatique" ) // DEBUG
	}

	self.ajouter_chargement = function(objDOM, type, axe, x0, f0, x1, f1)
	// Ajoute un chargement sur la poutre
	{
		// apparemment ça ne bug pas quand on ne fournit pas x1 et f1
		self.chargements.set( objDOM, new Chargement(objDOM, type, axe, x0, f0, x1, f1) ) // TODO x1 f1

		// alert("debug : bien ajouté") // DEBUG
	}

	self.modifier_chargement = function(objDOM, axe, x0, f0, x1, f1)
	// Modifie un chargement de la poutre
	{
		x0 -= gui.options.beam_ends_offset;
		x1 -= gui.options.beam_ends_offset;

		self.chargements.get( objDOM ).axe = axe;
		self.chargements.get( objDOM ).x0 = x0;
		self.chargements.get( objDOM ).f0 = f0;
		self.chargements.get( objDOM ).x1 = x1 || x0;
		self.chargements.get( objDOM ).f1 = f1 || f0;

		// alert("debug : chargement modifié") // DEBUG
		// console.log(self.chargements.get(objDOM));
	}

	self.retirer_chargement = function(objDOM)
	// Retire un chargement sur la poutre
	{
		self.chargements.delete( objDOM )

		// alert("debug : bien retiré") // DEBUG
	}

	self.compute_defo = function(canvas)
	// Calcule les déformées et les stock dans self.
	{
		console.log(" #====== UPDATE_DEF ========");

		var nx = canvas.width - 2*gui.options.beam_ends_offset; // nombre de points du domaine
		var dx = 1 / nx; // pas entre les points = longueur poutre / nombre de points

		if( !self.isostatique() )
		{
			console.log("Erreur (Poutre.compute_defo) : non isostatique")
			return 0
		}

		if( self.chargements.size === 0 )
		{
			// Aucun effort, rien ne se passe.
			for (var i = 0; i < nx; i++) {
				self.effort_N[i] = 0;
				self.effort_T[i] = 0;
				self.effort_M[i] = 0;
				self.u[i] = 0;
				self.v[i] = 0;
				self.theta[i] = 0;
			};
			return 1
		}

		// Calculer les vecteurs de sollicitations
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
			// TODO il faut soustraire gui.options.beam_ends_offset à tous les x... ou écrire directement le bon x dans les objets Liaison / Chargement
			// console.log(chargement.type); // DEBUG
			switch( chargement.type )
			{
				case "f_c":
					if( chargement.axe === "X" )
						FX[chargement.x0] += chargement.f0;
					else // Y
						FY[chargement.x0] += chargement.f0;
					break;

				case "f_r":
					if( chargement.axe === "X" )
					{
						for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
							FX[xi] += chargement.f0 * dx; // TODO interpolation entre f0 et f1
					}
					else // Y
					{
						for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
							FY[xi] += chargement.f0 * dx; // TODO interpolation
					}
					break;

				case "m_c":
					M[chargement.x0] += chargement.f0;
					break;

				case "m_r":
					for(var xi = chargement.x0; (xi < chargement.x1) && (xi < nx); xi++)
						M[xi] += chargement.f0 * dx; // TODO interpolation
					break;
			}
		}

		// PFS au point tout à gauche de la poutre

		// Somme des forces : FX.sum(),FY.sum()

		// Somme des moments en A
		M_A = 0;
		for (var i = 0; i < nx; i++)
		{
			M_A += FY[i] * i*dx; // force * bras de levier (<- efforts appliqués à gauche des tronçons, 1px = 1 tronçon)
		}
		// Moments purs
		M_A += M.sum(); // somme des moments concentrés et répartis

		// Vecteur des résultantes extérieures
		var F_ext = [FX.sum(),FY.sum(), M_A]; // Fx, Fy, M_A
		
		F_ext

		// Calcule les efforts aux liaisons (traction/compression et flexion découplées)
		var R0, x_R0; // réaction et postion de la liaison pour la traction-compression
		var x_R_flex = []; // position des efforts de liaisonsison pour la flexion
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
				C[1].push(liaison.x*dx) // attention à bien convertir en mètres : *dx
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
		console.log("R1 : "+type_R_flex[0]+" "+R1+" en x = "+x_R_flex[0]);
		console.log("R2 : "+type_R_flex[1]+" "+R2+" en x = "+x_R_flex[1]);



		// On a tous les efforts extérieurs (chargement + liaisons) :
		// on peut déterminer les efforts intérieurs par coupure


		// Efforts intérieurs

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
			S_M += arrondir( -M[i] - self.effort_T[i] * dx , 3);
			self.effort_M[i] = S_M;
		}
		//  il faut intégrer T de droite à gauche et cumuler M de droite à gauche.

		// Calcul de la déformée

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
			S_theta += self.effort_M[i] * dx / self.EI;
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
			S_v += self.theta[i]*dx;
			// console.log(1e7 * self.theta[i]*dx); // DEBUG
			self.v.push( S_v );
		}

		// On impose fortement la CL sur v : v=0 en x_R_flex[0] et x_R_flex[1]
		// La solution sans CL est définie à une droite près, on soustrait cette droite
		// pour annuler v sur les liaisons.
		// ATTENTION : ici ça marche parce que le seul moyen d'imposer une pente nulle,
		// c'est l'encastrement qui impose également une flèche nulle.
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

		console.log(" #====== FIN UPDATE_DEF ========");
		return 1
	}

	self.dessiner_defo = function(canvas)
	{
		var ctx = canvas.getContext("2d");
		var W = canvas.width;
		var H = canvas.height;
		ctx.clearRect(0,0,W,H);

		// Amplitudes
		var amp_u = 0.01; // 1 / self.u.abs().max() * W/2 * gui.options.defo_amplitude; // TODO selon la marge
		var amp_v = 1 / self.v.abs().max() * H/2 * gui.options.defo_amplitude;
		if( !isFinite(amp_v) ) amp_v = 0;

		console.log("amp_v " + amp_v);

		ctx.beginPath()
		ctx.moveTo(gui.options.beam_ends_offset + self.u[0] * amp_u, H/2 - self.v[0] * amp_v);
		for (var i = 1; i < self.v.length; i++) {
			ctx.lineTo(gui.options.beam_ends_offset + i + self.u[i] * amp_u, H/2 - self.v[i] * amp_v );
		};

		// Style du trait et dessin
		ctx.strokeStyle = "black";
		ctx.lineWidth = gui.options.defo_epaisseur;
		ctx.stroke()
	}
}

function arrondir(nombre, n_decimale)
{
	var puissance = Math.pow(10,n_decimale);
	return Math.round(nombre*puissance)/puissance;
}