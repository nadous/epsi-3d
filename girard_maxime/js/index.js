    var container, stats;

    var camera, scene, renderer, controls, group, clock;

    var particleGroup;

    var raycaster, mouse;

    var intersected;

    // makes a little responsive
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    // only global variables
    window.words = [];
    window.bounds = [];
    window.definitions = [];
    window.totalWordGenerated = 0;
    window.numberOfGroup = 0;
    window.wordsByCategory = {
        Synonyms: 0,
        Antonyms: 0,
        Rhymes: 0,
        Suggestions: 0,
        SoundLike: 0
    };

    // loading custom font
    var loader = new THREE.FontLoader();
    loader.load('fonts/Exo.json', function(font) {

        init(font);
        window.font = font; // create global var
    });

    var emitterSettings = {
        type: SPE.distributions.SPHERE,
        position: {
            spread: new THREE.Vector3(10),
            radius: 1,
        },
        velocity: {
            value: new THREE.Vector3(100)
        },
        size: {
            value: [30, 0]
        },
        opacity: {
            value: [1, 0]
        },
        color: {
            value: [new THREE.Color('orange'), new THREE.Color('red')]
        },
        particleCount: 100,
        alive: true,
        duration: 0.06,
        maxAge: {
            value: 0.6
        }
    };

    function init(font) {

        // DatGui generation
        var FizzyText = function() {
            this.word = 'Bad';
            this.category = "Synonyms";
            this.generate = function() {
                createWords(font, this.word, this.category);
            };
            this.reset = function() {
                destroyWords();
            };
        };

        clock = new THREE.Clock();

        window.settings = new FizzyText(); // make settings global for accessing later
        var gui = new dat.GUI();

        gui.add(settings, 'word');
        gui.add(settings, 'category', ['Synonyms', 'Antonyms', 'Rhymes', 'Suggestions', 'SoundLike']);
        gui.add(settings, 'generate');
        gui.add(settings, 'reset');

        particleGroup = new SPE.Group({
            texture: {
                value: new THREE.TextureLoader().load('./images/smokeparticle.png')
            },
            blending: THREE.AdditiveBlending,
            maxParticleCount: 1000
        });

        particleGroup.addPool(10, emitterSettings, false);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        container = document.createElement('div');
        document.body.appendChild(container);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.set(200, -100, 600);

        createWords(font, settings.word, settings.category, camera); // Create initial word

        renderer = new THREE.WebGLRenderer({
            alpha: true // make canvas transparent
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Add particle group to scene.
        particleGroup.mesh.frustumCulled = false;
        scene.add(particleGroup.mesh);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = .1;
        controls.rotateSpeed = .1;

        controls.target.set(350, -325, -100); // initial controls position set to default word generation
        controls.update();

        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousedown', onDocumentMouseDown, false);
        window.addEventListener('touchstart', onDocumentTouchStart, false);
        window.addEventListener('mousemove', onDocumentMouseMove, false);

        animate();
    }


    function createWords(font, word, category, camera) {
        var firstWordGeometry = new THREE.TextGeometry(word, {
            size: 20,
            height: 6,
            curveSegments: 3,
            font: font,
            bevelThickness: 1,
            bevelSize: 2,
            bevelEnabled: true,
        });

        firstWordGeometry.computeBoundingBox();

        var color;

        // API calls by category
        if (category == "Synonyms") {
            url = "https://api.datamuse.com/words?max=10&md=d&rel_syn=";
            color = 0xFF99FF;
        } else if (category == "Antonyms") {
            url = "https://api.datamuse.com/words?max=10&md=d&rel_ant=";
            color = 0x00FF00;
        } else if (category == "Suggestions") {
            url = "https://api.datamuse.com/sug?max=10&md=d&s=";
            color = 0xFF9933;
        } else if (category == "SoundLike") {
            url = "https://api.datamuse.com/words?max=10&md=d&sl=";
            color = 0xFF3300;
        } else {
            color = 0xFFFF00;
            url = "https://api.datamuse.com/words?max=10&md=d&rel_rhy=";
        }

        // firstWordMaterial
        var firstMaterial = new THREE.MultiMaterial([
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                overdraw: 0.5
            }),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                overdraw: 0.5
            })
        ]);

        // Other world material
        var material = new THREE.MultiMaterial([
            new THREE.MeshBasicMaterial({
                color: color,
                overdraw: 0.5
            }),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                overdraw: 0.5
            })
        ]);

        // set max group to avoid fps freez when too many text are displayed on screen
        if (window.numberOfGroup >= 5) {
            window.numberOfGroup = 0;
            destroyWords();
        }

        group = new THREE.Group();
        window.numberOfGroup++;

        // Creating firstWord
        var firstMesh = new THREE.Mesh(firstWordGeometry, firstMaterial);
        firstMesh.position.y = 0 - (numberOfGroup * 80);

        group.add(firstMesh);
        $.ajax({
            url: url + word,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                for (var i = 0; i < data.length; i++) {
                    // Resize text by word pertinence
                    if (data[i].score >= 10 && data[i].score < 150)
                        var fontSize = 6;
                    else if (data[i].score >= 150 && data[i].score < 500)
                        var fontSize = 7;
                    else if (data[i].score >= 500 && data[i].score <= 1000)
                        var fontSize = 9;
                    else if (data[i].score >= 1000 && data[i].score <= 2000)
                        var fontSize = 10;
                    else if (data[i].score > 2000)
                        var fontSize = 11;

                    var otherWordsGeometry = new THREE.TextGeometry(data[i].word, {
                        size: fontSize,
                        height: 1,
                        curveSegments: 1,
                        font: font,
                        bevelThickness: 0.5,
                        bevelSize: 0.5,
                        bevelEnabled: true,
                    });

                    otherWordsGeometry.computeVertexNormals(); // Reducing text geometry lag
                    otherWordsGeometry.computeBoundingBox();

                    var mesh = new THREE.Mesh(otherWordsGeometry, material);
                    mesh.name = data[i].word;

                    if (i == 0) { // Placing the first word after selected word
                        mesh.position.x = firstMesh.position.x + (word.length * 20);
                        mesh.position.y = firstMesh.position.y + 3 * (i + 1);
                        mesh.position.z = firstMesh.position.z;

                        // Arrow creation for connecting first and second word
                        var startPoint = new THREE.Vector3(firstMesh.position.x, firstMesh.position.y, firstMesh.position.z);
                        var endPoint = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
                        var direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
                        var arrow = new THREE.ArrowHelper(direction, startPoint, startPoint.distanceTo(endPoint), 0xCC0000);
                        scene.add(arrow);

                    } else { // Placing others word
                        mesh.position.x = previousMesh.position.x + (previousWord.length * 10);
                        mesh.position.y = firstMesh.position.y + 2 * (i + 1);
                        mesh.position.z = previousMesh.position.z - 10;

                        // Line creation for connecting two word
                        var lineGeometry = new THREE.Geometry();
                        lineGeometry.vertices.push(new THREE.Vector3(previousMesh.position.x, previousMesh.position.y, previousMesh.position.z), new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z));
                        lineGeometry.computeLineDistances();
                        var lineMaterial = new THREE.LineBasicMaterial({
                            color: 0xCCCCCC
                        });
                        var line = new THREE.Line(lineGeometry, lineMaterial);
                        scene.add(line);
                    }

                    var cube = compute_bounds(mesh, true);

                    var previousMesh = mesh;
                    var previousWord = data[i].word;

                    var wordDefinitions = {
                        name: data[i].word,
                        definitions: data[i].defs
                    };

                    window.definitions.push(wordDefinitions);

                    group.add(mesh);
                    group.add(cube);
                }

                // getting word type generation
                switch (category) {
                    case "Synonyms":
                        window.wordsByCategory.Synonyms += data.length;
                        break;
                    case "Antonyms":
                        window.wordsByCategory.Antonyms += data.length;
                        break;
                    case "Rhymes":
                        window.wordsByCategory.Rhymes += data.length;
                        break;
                    case "Suggestions":
                        window.wordsByCategory.Suggestions += data.length;
                        break;
                    default:
                        window.wordsByCategory.SoundLike += data.length;
                        break;
                }

                window.totalWordGenerated += data.length;
                renderPanelInfo();

            },
            error: function(err) {
                alert("Unable to get API data");
            }
        });
        scene.add(group);
    }

    function renderPanelInfo() {
        $("#totalSynonyms").text(window.wordsByCategory.Synonyms + " Synonyms");
        $("#totalAntonyms").text(window.wordsByCategory.Antonyms + " Antonyms");
        $("#totalRhymes").text(window.wordsByCategory.Rhymes + " Rhymes");
        $("#totalSuggestions").text(window.wordsByCategory.Suggestions + " Suggestions");
        $("#totalSoundLike").text(window.wordsByCategory.SoundLike + " SoundLike");
        $("#totalWords").text(window.totalWordGenerated + " in total");
        $("#currentWords").text(window.bounds.length + " in the scene");
    }

    // Create cube around text for mouse collision and events
    function compute_bounds(mesh, addToScene) {
        if (addToScene === undefined)
            addToScene = false;

        var bounds = mesh.geometry.boundingBox;
        var cubeSize = new THREE.Vector3().subVectors(bounds.max, bounds.min)
        var geometry = new THREE.BoxGeometry(cubeSize.x, cubeSize.y, cubeSize.z);

        var material = new THREE.MeshBasicMaterial({
            opacity: 0,
            transparent: true
        });

        var cube = new THREE.Mesh(geometry, material);

        // Create cube size based on mesh text size
        cube.position.set(
            mesh.position.x + cubeSize.x * .5,
            mesh.position.y + cubeSize.y * .5,
            mesh.position.z + cubeSize.z * .5);

        if (addToScene) {
            scene.add(cube);
        }

        cube.name = mesh.name;
        window.bounds.push(cube);
        return cube;
    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    // Delete every words generation and context associated
    function destroyWords() {

        window.numberOfGroup = 0;
        window.words = [];
        window.definitions = [];
        window.bounds = [];
        window.wordsByCategory = {
            Synonyms: 0,
            Antonyms: 0,
            Rhymes: 0,
            Suggestions: 0,
            SoundLike: 0
        };
        renderPanelInfo();
        scene.children.slice().forEach(function(obj) {
            $("#currentWords").text("0 in the scene");
            if (obj.type == "Group" || obj.type == "Line" || obj.type == "Object3D")
                scene.remove(obj);
        });
    }

    function animate() {

        requestAnimationFrame(animate);

        render();
        stats.update();

    }

    function render() {
        particleGroup.tick(clock.getDelta());
        renderer.render(scene, camera);
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(window.bounds);

        // checking mouse over collision
        if (intersects.length > 0) {
            // looping every definitions to find hovered word definition
            $.each(window.definitions, function(index, value) {
                if (value.name == intersects[0].object.name) {
                    $("#wordDefTitle").text(value.name + " definitions");
                    for (var i = 0; i < 3; i++) {
                        if (value.definitions !== undefined) {
                            if (value.definitions[i] !== undefined) {
                                var splittedText = value.definitions[i].split("\t"); // splitting tab character
                                $("#definitionPanel").show();
                                if (splittedText[0] == "n") {
                                    $("#type" + i).text("name");
                                } else if (splittedText[0] == "v") {
                                    $("#type" + i).text("verb");
                                } else {
                                    $("#type" + i).text(splittedText[0]);
                                }
                                $("#def" + i).text(splittedText[1]);
                            }
                        }
                    }

                }
            });

            resizeText(true, scene.getObjectByName(intersects[0].object.name));
            intersected = intersects[0];

        } else {
            if (intersected != null) {
                $("#definitionPanel").hide();
                resizeText(false, scene.getObjectByName(intersected.object.name));
            }
        }
    }

    function resizeText(toggle, object) {
        if (toggle) {
            var text = object;
            text.scale.z = 1.5;
            text.scale.y = 1.5;
            text.scale.x = 1.5;
        } else {
            var text = object;
            text.scale.z = 1;
            text.scale.y = 1;
            text.scale.x = 1;
        }

    }

    function onDocumentTouchStart(event) {

        event.preventDefault();

        event.clientX = event.touches[0].clientX;
        event.clientY = event.touches[0].clientY;

        onDocumentMouseDown(event);

    }

    function onDocumentMouseDown(event) {
        if (event.which == 1) { // Only for left mouse button

            mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
            mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            var intersects = raycaster.intersectObjects(window.bounds); // Check collision with text bounds

            if (intersects.length > 0) { // Collision detected
                particleGroup.triggerPoolEmitter(10, intersects[0].object.position); // play particles on object position
                createWords(window.font, intersects[0].object.name, window.settings.category); // Word generation based on text clicked
            }
        }
    }

    function onDocumentMouseMove(event) {

        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    }
