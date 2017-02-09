import {
	scene,
	camera,
	renderer
} from './common/scene';
import {
	setEvents
} from './common/setEvents';
import {
	convertToXYZ,
	getEventCenter,
	geodecoder
} from './common/geoHelpers';
import {
	mapTexture
} from './common/mapTexture';
import {
	getTween,
	memoize
} from './common/utils';

/* Attention la méthode d'import est différentes ici,
 * probleme de librairie -> http://stackoverflow.com/questions/41291142/topojson-uncaught-typeerror-cannot-read-property-feature-of-undefined
 */
import * as topojson from 'topojson';
import THREE from 'THREE';
import OrbitControls from 'node_modules/three-orbit-controls/index';
import d3 from 'd3';
import Papa from "node_modules/papaparse/papaparse";

var gParsedCountryData;
var gMin;
var gMax;

// utilisé pour regler la caméra
var OB = OrbitControls(THREE);
var controls;

// Pour papaparse, il est nécéssaire de recharger manuellement la librairie -> https://github.com/mholt/PapaParse/issues/148
Papa.SCRIPT_PATH = "node_modules/papaparse/papaparse.js";
// Appel de la fonction de parsing avec callback pour transmettre les données
parseData("../../data/data_co2.csv", doStuff);



// On parse les données et on récupère le taux d'emission min et max de l'ensemble des pays
function parseData(url, callBack) {
	// console.log(OB);
	Papa.parse(url, {
		delimiter: ",",
		header: true,
		download: true,
		complete: function(results, file) {
			var result = [];
			var min = Number.POSITIVE_INFINITY;
			var max = Number.NEGATIVE_INFINITY;
			for (var i = 0; i < results.data.length; i++) {
				//init
				var item = results.data[i];
				var cntryName = item["Country Name"];
				var data2013 = item["2013"];
				result[cntryName] = data2013;
				// Besoin de faire une vérification car certaines données sont absentes
				if (data2013 != "") {
					min = Math.min(min, data2013);
					max = Math.max(max, data2013);
				}
			}
			console.log("valeur mini: ", min);
			console.log("valeur maxi: ", max);
			//Appel du callBack et demarrage du programme
			callBack(result, min, max);
		}
	});
}

// Complete le code hexa d'une couleur par des zero
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

// Transforme un code RGB en hexadecimal
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


// Fonction callback qui execute la quasi totalité du script
function doStuff(parsedCountryData, minEmissionCntry, maxEmissionCntry) {
	gParsedCountryData = parsedCountryData;
	gMin = minEmissionCntry;
	gMax = maxEmissionCntry;

	controls = OB(camera, renderer.domElement);
	// controls.addEventListener('change', render);
	// Chargement de la carte avec les identifiants par pays. A voir à l'intérieur.
	// On remarque qu'on définit des arcs de points pour les pays
	// format: {"type":"MultiPolygon","arcs":[[[6,7,8,9]],[[10,11,12]]],"id":"Angola"}
	d3.json('data/world.json', function(err, data) {

		d3.select("#loading").transition().duration(500)
			.style("opacity", 0).remove();

		var currentCountry, overlay;

		// number of vertices. Higher = better mouse accuracy
		// Vérifié. Passage de 155 en std à 200.
		var segments = 200;

		// Setup cache for country textures
		var countries = topojson.feature(data, data.objects.countries);
		var geo = geodecoder(countries.features);

		// Script embarqué à l'init. A priori pas besoin de le modifier.
		// On va initialiser le cache de la texture lors du mouseOver
		var textureCache = memoize(
			function(cntryID, color) {
				var country = geo.find(cntryID);
				return mapTexture(country, color);
			}
		);

		// Base globe with blue "water"
		let blueMaterial = new THREE.MeshPhongMaterial({
			color: '#2B3B59',
			transparent: true
		});
		let sphere = new THREE.SphereGeometry(200, segments, segments);
		let baseGlobe = new THREE.Mesh(sphere, blueMaterial);
		baseGlobe.rotation.y = Math.PI;
		baseGlobe.addEventListener('click', onGlobeClick);
		baseGlobe.addEventListener('mousemove', onGlobeMousemove);

		// add base map layer with all countries
		// Besoin d'invervention ici. On va appliquer la couleur que l'on désire à chaque country
		let worldTexture = mapTexture(countries, '#647089');
		let mapMaterial = new THREE.MeshPhongMaterial({
			map: worldTexture,
			transparent: true
		});
		var baseMap = new THREE.Mesh(new THREE.SphereGeometry(200, segments, segments), mapMaterial);
		baseMap.rotation.y = Math.PI;

		// create a container node and add the two meshes
		var root = new THREE.Object3D();
		root.scale.set(2.5, 2.5, 2.5);
		root.add(baseGlobe);
		root.add(baseMap);
		scene.add(root);

		function onGlobeClick(event) {
			// Get pointc, convert to latitude/longitude
			var latlng = getEventCenter.call(this, event);
			// on recherche si on a cliquer sur un pays
			var country = geo.search(latlng[0], latlng[1]);
			// si on clique sur un pays
			if (country !== null) {
				console.log("Pays rencontré -> ", country.code);
			} else // si on cique en dehors du globe || n'est pas un pays
			{
				// Get new camera position
				var temp = new THREE.Mesh();
				temp.position.copy(convertToXYZ(latlng, 900));
				temp.lookAt(root.position);
				temp.rotateY(Math.PI);

				for (let key in temp.rotation) {
					if (temp.rotation[key] - camera.rotation[key] > Math.PI) {
						temp.rotation[key] -= Math.PI * 2;
					} else if (camera.rotation[key] - temp.rotation[key] > Math.PI) {
						temp.rotation[key] += Math.PI * 2;
					}
				}

				var tweenPos = getTween.call(camera, 'position', temp.position);
				d3.timer(tweenPos);

				var tweenRot = getTween.call(camera, 'rotation', temp.rotation);
				d3.timer(tweenRot);
			}
		}

		function onGlobeMousemove(event) {
			var map, material;

			// Get pointc, convert to latitude/longitude
			var latlng = getEventCenter.call(this, event);

			// Look for country at that latitude/longitude
			var country = geo.search(latlng[0], latlng[1]);

			if (country !== null && country.code !== currentCountry) {

				// Track the current country displayed
				currentCountry = country.code;

				// Update the html
				d3.select("#msg").html(country.code);

				// Overlay the selected country
				//Il faut ici modifier la couleur lors de l'overlay
				var valueCountry = gParsedCountryData[country.code];
				var co2_factor = valueCountry / gMax;
				if (co2_factor > .75) {
					console.log('179,0,0');
					map = textureCache(country.code, rgbToHex(100, 0, 0));
				} else if (co2_factor > .5) {
					var variation = map_number(co2_factor, .5, .75, 255, 100);
					console.log(Math.round(variation), ',0,0');
					map = textureCache(country.code, rgbToHex(Math.round(variation), 0, 0));
				} else if (co2_factor > .25) {
					var variation = map_number(co2_factor, .5, .75, 77, 0);
					console.log('255,', Math.round(variation), ',', Math.round(variation));
					map = textureCache(country.code, rgbToHex(255, Math.round(variation), Math.round(variation)));
				} else if (co2_factor > 0) {
					var green = map_number(co2_factor, 0, .25, 179, 100);
					console.log('0,', Math.round(green), ',0');
					map = textureCache(country.code, rgbToHex(0, Math.round(green), 0));
				} else //pas de valeur
				{
					console.log('NaN');
					map = textureCache(country.code, rgbToHex(255, 255, 255));
				}
				material = new THREE.MeshPhongMaterial({
					map: map,
					transparent: true
				});
				if (!overlay) {
					overlay = new THREE.Mesh(new THREE.SphereGeometry(201, 40, 40), material);
					overlay.rotation.y = Math.PI;
					root.add(overlay);
				} else {
					overlay.material = material;
				}
			}
		}

		setEvents(camera, [baseGlobe], 'click');
		setEvents(camera, [baseGlobe], 'mousemove', 10);
	});

	function animate() {
		requestAnimationFrame(animate);
		// controls.update();

		renderer.render(scene, camera);
	}

	function map_number(n, in_min, in_max, out_min, out_max) {
		return (n - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	animate();
}
