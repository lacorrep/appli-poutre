// Fonctions pour le debugage, inutile de les inclure dans la version finale.

function debug()
// Active les outils de débugage
{
	$("#debug-tools").css("display","block");
}

function debugListeDesChargements()
{
	for(var chargement of poutre.chargements.values())
	{
		console.log(chargement);
		console.log("type " + chargement.type);
		console.log("axe " + chargement.axe);
		console.log("x0 " + chargement.x0);
		console.log("x1 " + chargement.x1);
		console.log("f0 " + chargement.f0);
		console.log("f1 " + chargement.f1);
	}
}
function debugListeDesLiaisons()
{
	for(var liaison of self.liaisons.values())
	{
		console.log(liaison);
		console.log("x " + liaison.x);
		console.log("type " + liaison.type);
		console.log("bloque " + liaison.bloque);
	}
}