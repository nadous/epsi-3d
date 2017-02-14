// API Keys
var apiKey1 = "1f8cb2e0c01c667f12e5ead5175ae511";
var apiKey2 = "65d91229b02bb98ef4506d93cf5518f2";
var apiKey3 = "72c35f16c6c5fc441a07250e2ec80446";
// Change if ban !
var apiKey = apiKey2;
// API Calls: Towns
var apiCalls = ["grenoble", "crolles", "chatte", "voiron", "vif", "vaujany", "chambery", "mens", "pelvoux", "charavines", "moutiers", "briancon", "Lus-la-Croix-Haute", "gap", "allevard", "Bourgoin-Jallieu", "Beaurepaire", "Remuzat"];
var treatedCalls = 0;
// ThreeJS Scene
var container, stats;
var scene, camera, renderer, controls, clock, clock2, clock3, clock4, clock5;
// 3D Elements
var particleGroupCloud, particleGroupBlackCloud, particleGroupRain, particleGroupSun, particleGroupSnow;
var texts = [];
var arrows = [];
var font;
// Days is the offset of days for meteo info
var days = 0;
// Utilities
var jours = new Array(
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi'
);

// Waiting for document to load
document.addEventListener('DOMContentLoaded', function() {
    var fontLoader = new THREE.FontLoader();
    fontLoader.load( '../three.js-master/examples/fonts/helvetiker_regular.typeface.json', function ( fontR ) {
        font = fontR;
        // Init the base scene
        init();
        // Set event for meteo switch
        $('.dropDownListItem').click(function(e) {
            days = $(this).attr("data-day");
            $('#meteoLabel').text($(this).text());
            resetMeteo(); 
        });
    } );
});

function init() {
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    // Scene creation
    container = document.getElementById('container');
    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0x000000, 0.075);

    // Light and Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 16, -35);

    var light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(0, 100, 0);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    scene.add(light);
    
    // Skybox
    
    var geometry = new THREE.SphereGeometry(600, 60, 40);  
    var uniforms = {  
      texture: { type: 't', value: THREE.ImageUtils.loadTexture('./assets/sky.jpg') }
    };

    var material = new THREE.ShaderMaterial( {  
      uniforms:       uniforms,
      vertexShader:   document.getElementById('sky-vertex').textContent,
      fragmentShader: document.getElementById('sky-fragment').textContent
    });

    skyBox = new THREE.Mesh(geometry, material);  
    skyBox.scale.set(-1, 1, 1);  
    skyBox.rotation.order = 'XZY';  
    skyBox.renderDepth = 1000.0;  
    scene.add(skyBox);
    
    // Controls
    controls = new THREE.OrbitControls(camera);
    controls.enableDamping = true;
    controls.dampingFactor = .1;
    controls.rotateSpeed = .1;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI/2 - 5 * Math.PI / 180; 

    // Renderer settings
    renderer = new THREE.WebGLRenderer({
        antialias: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0xffffff);
    container.appendChild(renderer.domElement);
    
    stats = new Stats();
    container.appendChild(stats.dom);
    
    // Clocks
    clock = new THREE.Clock();
    clock2 = new THREE.Clock();
    clock3 = new THREE.Clock();
    clock4 = new THREE.Clock();
    clock5 = new THREE.Clock();
    
    // Terrain
    var loader = new THREE.OBJLoader();
    var objLoader = new THREE.OBJLoader();
    objLoader.load("models/grenobleTexFix7.obj", function ( object ) {                        
        // Load and apply texture
        var meshMaterial = new THREE.MeshPhongMaterial({ transparent: false, map: THREE.ImageUtils.loadTexture('./assets/grenobleZoneTextures4.png') });
        object.children[0].material = meshMaterial;
        scene.add(object);
    });
    
    // Meteo Generation
    // (Waiting for terrain to be generated is a waste of time, start parsing API and resetMeteo now)
    resetMeteo(font);
}

function resetMeteo()
{
    // Existing Particle Groups removal from scene
    if(particleGroupBlackCloud)
    {
        scene.remove(particleGroupBlackCloud.mesh);
    }
    
    if(particleGroupCloud)
    {
        scene.remove(particleGroupCloud.mesh);
    }
    
    if(particleGroupRain)
    {
        scene.remove(particleGroupRain.mesh);
    }
    
    if(particleGroupSun)
    {
        scene.remove(particleGroupSun.mesh);
    }
    
    if(particleGroupSnow)
    {
        scene.remove(particleGroupSnow.mesh);
    }           
    
    // Init groups
    particleGroupBlackCloud = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('./assets/cloud.png')
        },
        maxParticleCount: 500,
        blending: THREE.NormalBlending,
        fog: true
    });
    
    particleGroupCloud = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('./assets/cloud.png')
        },
        maxParticleCount: 500,
        blending: THREE.NormalBlending,
        fog: true
    });
    
    particleGroupRain = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('./assets/rain.png')
        },
        maxParticleCount: 1500,
        blending: THREE.NormalBlending,
        fog: false
    });
    
    particleGroupSnow = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('./assets/snow2.png')
        },
        maxParticleCount: 1500,
        blending: THREE.NormalBlending,
        fog: false
    });
    
    particleGroupSun = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('./assets/sun.png')
        },
        maxParticleCount: 500,
        blending: THREE.NormalBlending,
        fog: false
    });
    
    // Removing Texts
    for (i = 0; i < texts.length; i++) {
        scene.remove(texts[i]);
    }
    texts = [];
    
    // Removing Arrows
    for (i = 0; i < arrows.length; i++) {
        scene.remove(arrows[i]);
    }
    arrows = [];
    
    // Setting new meteo
    treatedCalls = 0;
    for (i = 0; i < apiCalls.length; i++) {
        runAPICall(apiCalls[i]);
    }
}

// Run API Call and generate 3D elements
function runAPICall(name) {
    var url;
    // Is days the current day ?
    if(days == 0)
    {
        url = "http://api.openweathermap.org/data/2.5/weather?q=" + name + "&units=metric&APPID="+apiKey;
    }
    // Are we checking in the future ? API is different !
    else
    {
        // cnt is a return limit parameter for the API (number of meteo future infos)
        var cnt = 0;
        if (days >=1)
        {
            cnt+= 8 * days;
        }
        url = "http://api.openweathermap.org/data/2.5/forecast?q=" + name + "&cnt=" + cnt + "&units=metric&APPID="+apiKey;
    }
    console.log(url);
    $.getJSON( url, function( data ) {
        // Set common variables
        var weather;
        var wind;
        var temp;
        var coord;
        var date;
        // Set values depending of the API used
        if(days == 0)
        {
            weather = data.weather[0];
            wind = data.wind;
            temp = data.main.temp;
            coord = data.coord;
            date = data.dt;
        }
        else
        {
            weather = data.list[data.list.length-1].weather[0];
            wind = data.list[data.list.length-1].wind;
            temp = data.list[data.list.length-1].main.temp;
            coord = data.city.coord;
            date = data.list[data.list.length-1].dt;
        }
        
        // To uncomment if random temperatures needed
        //temp = Math.floor((Math.random() * 28) + -10);
        
        // Generate and set date from API data generation timestamp
        var d = new Date(date*1000);
        var dateStr = jours[d.getDay()] + " " + d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
        $('#dateLabel').text(dateStr);
        
        // Set base x y and z values for 3D objects (using geoToLocal)
        y = Math.floor((Math.random() * 4) + 2);        
        z = -geoToLocal(coord.lat, 43.99, 46.0, -10, 10);
        x = -geoToLocal(coord.lon, 7.0, 5.0, -10, 10);
        
        // Meteo Generation depending off weather
        if(weather.main == "Rain" || weather.main == "Drizzle")
        {
            generateBlackCloud(x, y, z);
            generateRain(x, y, z); 
        }
        else if(weather.main == "Clouds" || weather.main == "Mist")
        {
            generateCloud(x, y, z);
        }
        else if(weather.main == "Snow")
        {
            generateSnow(x, y, z);
            generateCloud(x, y, z);
        }
        else
        {
             generateSun(x, y, z); 
        }
        
        // Wind Arrows
        generateWind(x, y+6, z, wind.speed, wind.deg);
        
        // Text Material is based on temp
        var material = new THREE.MultiMaterial( [
            new THREE.MeshBasicMaterial( { color: temperatureHex(temp), overdraw: 0.5 } ),
            new THREE.MeshBasicMaterial( { color: 0x000000, overdraw: 0.5 } )
        ] );
        
        // City Name
        var geometry = new THREE.TextGeometry( name, {
            font: font,
            size: 0.3,
            height: 0,
            curveSegments: 0
        });
        geometry.computeBoundingBox();
        var centerOffset = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(x+centerOffset,y+2.2,z);
        
        // Temperature
        
        var geometry2 = new THREE.TextGeometry( temp + " C", {
            font: font,
            size: 0.25,
            height: 0,
            curveSegments: 0
        });
        geometry2.computeBoundingBox();
        var centerOffset2 = -0.5 * ( geometry2.boundingBox.max.x - geometry2.boundingBox.min.x );
        var mesh2 = new THREE.Mesh( geometry2, material );
        mesh2.position.set(x+centerOffset2,y+1.6,z);
        
        // Adding City and Temperature Texts to scene
        texts.push(mesh);
        scene.add(mesh);
        texts.push(mesh2);
        scene.add(mesh2);
        
        // call treatment ending
        treatedCalls+= 1;
        // check if particles can be added
        addParticles();
    });
}

// Checking if all API Calls was treated
function addParticles() {
    if(treatedCalls >= apiCalls.length)
    {
        // Add every particles groups to scene
        scene.add( particleGroupCloud.mesh );
        scene.add( particleGroupBlackCloud.mesh );
        scene.add( particleGroupRain.mesh );
        scene.add( particleGroupSnow.mesh );
        scene.add( particleGroupSun.mesh );
        console.log("Added particles groups to scene");
        // Start rendering the scene !
        render();
    }
}

// Rendering function
function render() {
    requestAnimationFrame(render);
    // Particles and Texts was added to scene
    if(treatedCalls >= apiCalls.length)
    {
        // Tick particles, let it animate...
        particleGroupCloud.tick(clock.getDelta());
        particleGroupBlackCloud.tick(clock2.getDelta());
        particleGroupSun.tick(clock3.getDelta());
        particleGroupSnow.tick(clock4.getDelta());
        particleGroupRain.tick(clock5.getDelta());
        
        // Rotate Texts to face camera
        for (i = 0; i < texts.length; i++) {
            texts[i].lookAt( camera.position );
        }
    }
    
    // Update ThreeJS
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}