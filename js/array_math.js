Array.prototype.abs = function() {
	return this.map(Math.abs);
};

Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

Array.prototype.min = function() {
	return Math.min.apply(null, this);
};


Array.prototype.zeros = function(n) {
	var tab = [];

	for (var i = 0; i < n; i++)
		tab[i] = 0;

	return tab
};

Array.prototype.sum = function() {
	var S = 0;

	for (var i = 0; i < this.length; i++)
		S += this[i];

	return S
};