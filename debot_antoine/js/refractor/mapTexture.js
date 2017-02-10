var projection = d3.geo.equirectangular()
	.translate([1024, 512])
	.scale(325);

function mapTexture(geojson, color) {
	var texture, context, canvas;

	canvas = d3.select("body").append("canvas")
		.style("display", "none")
		.attr("width", "2048px")
		.attr("height", "1024px");

	context = canvas.node().getContext("2d");

	var path = d3.geo.path()
		.projection(projection)
		.context(context);

	context.strokeStyle = "#333";
	context.lineWidth = 1;
	context.fillStyle = color || "#CDB380";

	context.beginPath();

	path(geojson);

	if (color) {
		context.fill();
	}

	context.stroke();

	// DEBUGGING - Really expensive, disable when done.
	// console.log(canvas.node().toDataURL());

	texture = new THREE.Texture(canvas.node());
	texture.needsUpdate = true;

	// canvas.remove();

	return texture;
}

function mapTextures(geojson, map_number) {
	var texture, context, canvas;

	canvas = d3.select("body").append("canvas")
		.style("display", "none")
		.attr("width", "2048px")
		.attr("height", "1024px");

	context = canvas.node().getContext("2d");

	var path = d3.geo.path()
		.projection(projection)
		.context(context);

	context.strokeStyle = "#333";
	context.lineWidth = 1;
	// dans la boucle
	for (var i = 0; i < geojson.features.length; i++) {
    // on calcule la couleur souhaiter


    var countrySelected = geojson.features[i].id
    var valueCountry = gParsedCountryData[countrySelected];
    var hexaColor = '#ffffff';
    if (typeof valueCountry != 'undefined') {
        var co2_factor = valueCountry / gMax;
        if (co2_factor > .75) {
            hexaColor = rgbToHex(100, 0, 0);
        } else if (co2_factor > .5) {
            var variation = map_number(co2_factor, .5, .75, 255, 100);
            hexaColor = rgbToHex(Math.round(variation), 0, 0);
        } else if (co2_factor > .25) {
            var variation = map_number(co2_factor, .5, .75, 77, 0);
            hexaColor = rgbToHex(255, Math.round(variation), Math.round(variation));
        } else if (co2_factor > 0) {
            var green = map_number(co2_factor, 0, .25, 179, 100);
            hexaColor = rgbToHex(0, Math.round(green), 0);
        } else //pas de valeur
        {
          hexaColor = rgbToHex(255, 255, 255);
        }
    }



		context.fillStyle = hexaColor;
		context.beginPath();
		path(geojson.features[i]);
		//path(geojson);
		//if (color) {
			context.fill();
		//}
		context.stroke();
	}
	// DEBUGGING - Really expensive, disable when done.
	// console.log(canvas.node().toDataURL());

	texture = new THREE.Texture(canvas.node());
	texture.needsUpdate = true;

	// canvas.remove();

	return texture;
}
