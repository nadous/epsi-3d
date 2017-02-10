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

function mapTextures(geojson, map_number, mapToHex) {
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
		var hexaColor = mapToHex(geojson.features[i].id);
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
