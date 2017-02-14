// Mapping of geo locations to local locations
function geoToLocal(n, in_min, in_max, out_min, out_max) {
    return (n - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Utility: Temperature (celcius) to Hex color
// Inspired by Stackoverflow
function temperatureHex(t)
{
    // Map the temperature to a 0-1 range
    var a = (t + 30)/60;
    a = (a < 0) ? 0 : ((a > 1) ? 1 : a);

    // Scrunch the green/cyan range in the middle
    var sign = (a < .5) ? -1 : 1;
    a = sign * Math.pow(2 * Math.abs(a - .5), .35)/2 + .5;

    // Linear interpolation between the cold and hot
    var h0 = 259;
    var h1 = 12;
    var hue = (h0) * (1 - a) + (h1) * (a);
    
    // Get and return Hex Color
    color = new w3color("hsl("+Math.round(hue)+", 70%, 50%)");
    var rgb = color.toHexString();
    return rgb;
}

function on_window_resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}