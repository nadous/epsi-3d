function generateWind(x, y, z, speed, angle) {
    // Set origin and destination vectors
    var origin = new THREE.Vector3( x, y, z );
    var to = new THREE.Vector3( x+1, y, z );
    var rotationAxis = new THREE.Vector3( 0, 1, 0 );
    // Apply rotation axis
    to.applyAxisAngle( rotationAxis, angle );
    var direction = to.clone().sub(origin);
    var length = speed;
    var arrow = new THREE.ArrowHelper(direction.normalize(), origin, length, 0xff0000 );
    // Add arrow to scene
    arrows.push(arrow);
    scene.add( arrow );
}

function generateSun(x, y, z) {           
    var emitter = new SPE.Emitter({
        particleCount: 5,
        maxAge: {
            value: 7,
        },
        position: {
            value: new THREE.Vector3( x, y, z ),
            spread: new THREE.Vector3( 0, 0, 0)
        },
        velocity: {
            value: new THREE.Vector3( 0, 0, 0 )
        },
        wiggle: {
            spread: 1
        },
        size: {
            value: 9,
            spread: 0
        },
        spread: {
            value: new THREE.Vector3( 13, 13, 13 )
        },
        opacity: {
            value: [ 1, 1, 1 ]
        },
        color: {
             value: [ new THREE.Color( 0xFCD440 ), new THREE.Color( 0xffff00 ) ]
        }
    });
    particleGroupSun.addEmitter( emitter );
}

function generateCloud(x, y, z) {
    var emitter = new SPE.Emitter({
        particleCount: 5,
        maxAge: {
            value: 7,
        },
        position: {
            value: new THREE.Vector3( x, y, z ),
            spread: new THREE.Vector3( 0, 0, 0)
        },
        velocity: {
            value: new THREE.Vector3( 0, 0, 0 )
        },
        wiggle: {
            spread: 1
        },
        size: {
            value: 10,
            spread: 0
        },
        opacity: {
            value: [ 1, 0.5, 0 ]
        },
        color: {
             value: [ new THREE.Color( 0xFDFDFD ), new THREE.Color( 0xF3F9FB ) ]
        }
    });
    particleGroupCloud.addEmitter( emitter );
}

function generateBlackCloud(x, y, z) {
    var emitter = new SPE.Emitter({
        particleCount: 5,
        maxAge: {
            value: 7,
        },
        position: {
            value: new THREE.Vector3( x, y, z ),
            spread: new THREE.Vector3( 0, 0, 0)
        },
        velocity: {
            value: new THREE.Vector3( 0, 0, 0 )
        },
        wiggle: {
            spread: 1
        },
        size: {
            value: 10,
            spread: 0
        },
        opacity: {
            value: [ 1, 0.5, 0 ]
        },
        color: {
             value: [ new THREE.Color( 0x333333 ), new THREE.Color( 0x111111 ) ],
            spread: [ new THREE.Vector3( 0.2, 0.1, 0.1 ), new THREE.Vector3( 0, 0, 0 ) ]
        }
    });
    particleGroupBlackCloud.addEmitter( emitter );
}

function generateRain(x, y, z) {
    var emitter = new SPE.Emitter({
        particleCount: 70,
        maxAge: {
            value: 3,
        },
        position: {
            value: new THREE.Vector3( x, y+0.65, z ),
            spread: new THREE.Vector3( 0.8, 0, 0.8)
        },
        velocity: {
            value: new THREE.Vector3( 0, 0, 0 )
        },
        acceleration: {
            value: new THREE.Vector3( 0, -0.8, 0 )
        },
        wiggle: {
            spread: 0
        },
        size: {
            value: 0.8,
            spread: 0
        },
        opacity: {
            value: [ 0.5, 0.5, 0 ]
        },
        color: {
             value: [ new THREE.Color( 0x1F547A ), new THREE.Color( 0x0F283A ) ]
        }
    });
    particleGroupRain.addEmitter( emitter );
}

function generateSnow(x, y, z) {
    var emitter = new SPE.Emitter({
        particleCount: 30,
        maxAge: {
            value: 7,
        },
        position: {
            value: new THREE.Vector3( x, y+0.65, z ),
            spread: new THREE.Vector3( 0.8, 0, 0.8)
        },
        velocity: {
            value: new THREE.Vector3( 0, 0, 0 )
        },
        acceleration: {
            value: new THREE.Vector3( 0, -0.08, 0 )
        },
        wiggle: {
            spread: 0
        },
        size: {
            value: 0.8,
            spread: 0
        },
        opacity: {
            value: [ 1, 0.5, 0 ]
        },
        color: {
             value: [ new THREE.Color( 0xFFFAFA ), new THREE.Color( 0xFAF9F9 ) ]
        }
    });
    particleGroupSnow.addEmitter( emitter );
}
