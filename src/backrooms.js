import * as THREE from 'three';
import { initNavigation } from './nav.js';

initNavigation('backrooms');

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Backrooms aesthetic settings
const scene = new THREE.Scene();
const fogColor = new THREE.Color(0x2a2510); // Darker muddy brown
scene.background = fogColor;
scene.fog = new THREE.FogExp2(fogColor, 0.08); // Slightly adjusted for better distance masking

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 0); // Eye level
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

// Lights: Fluorescent overhead buzzing
const ambientLight = new THREE.AmbientLight(0xfff5d6, 0.05); 
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xfff5d6, 0.6, 10);
pointLight.position.set(0, 3.5, 0);
scene.add(pointLight);

// Audio Setup (Humming sound)
let audioCtx, oscillator, filter, gainNode;
let isAudioOn = false;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 60; // 60Hz hum
    
    filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250; 

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.value = 0;
    oscillator.start();
}

document.getElementById('audio-toggle').addEventListener('click', (e) => {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    isAudioOn = !isAudioOn;
    e.target.textContent = isAudioOn ? 'Audio: ON' : 'Audio: OFF';
    gainNode.gain.setTargetAtTime(isAudioOn ? 0.05 : 0, audioCtx.currentTime, 0.1);
});

function spawnFigure() {
    // Force find an empty spot near the player
    for (let attempt = 0; attempt < 30; attempt++) {
        let rx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.floor(Math.random() * 4)); 
        let rz = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.floor(Math.random() * 4));
        let pgx = Math.round(camera.position.x / BLOCK_SIZE) + rx;
        let pgz = Math.round(camera.position.z / BLOCK_SIZE) + rz;

        if (!isWall(pgx, pgz)) {
            figureBasePos.set(pgx * BLOCK_SIZE, 0, pgz * BLOCK_SIZE);
            figureGroup.position.copy(figureBasePos);
            figureGroup.visible = true;
            figureActive = true;
            figureLiveTimer = 0;
            figureSpawnTimer = 0;
            return true;
        }
    }
    return false;
}

document.getElementById('spawn-toggle').addEventListener('click', () => {
    spawnFigure();
});

document.getElementById('arrow-toggle').addEventListener('click', () => {
    showDevArrow = !showDevArrow;
});

// Textures
const texLoader = new THREE.TextureLoader();
const wallTex = texLoader.load('./img/backrooms_wallpaper.png');
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(2, 2); // Repeat on 4x4 wall block

const carpetTex = texLoader.load('./img/backrooms_carpet.png');
carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping;
carpetTex.repeat.set(40, 40);

const ceilingTex = texLoader.load('./img/backrooms_ceiling.png');
ceilingTex.wrapS = ceilingTex.wrapT = THREE.RepeatWrapping;
ceilingTex.repeat.set(40, 40);

// Floor and Ceiling (Huge planes that follow the player)
const planeGeo = new THREE.PlaneGeometry(160, 160);
const floorMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 1.0 });
const floor = new THREE.Mesh(planeGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const ceilMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.8, emissive: 0x111111 });
const ceiling = new THREE.Mesh(planeGeo, ceilMat);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 4.0;
scene.add(ceiling);

// Maze / Infinite Generation Setup
const BLOCK_SIZE = 4;
const RENDER_RADIUS = 12; // Increased to cover more distance
const MAX_INSTANCES = (RENDER_RADIUS*2+1) * (RENDER_RADIUS*2+1);

const wallGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
const instancedWalls = new THREE.InstancedMesh(wallGeo, wallMat, MAX_INSTANCES);
instancedWalls.frustumCulled = false; // Prevent culling as we move global instances
scene.add(instancedWalls);

// Shadowy Figure Asset
const figureGroup = new THREE.Group();
const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 3.2, 16);
const pureBlackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const body = new THREE.Mesh(bodyGeo, pureBlackMat);
body.position.y = 1.6; // Feet at 0
figureGroup.add(body);

const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
const redGlowingMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const leftEye = new THREE.Mesh(eyeGeo, redGlowingMat);
leftEye.position.set(-0.15, 2.8, 0.38);
figureGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, redGlowingMat);
rightEye.position.set(0.15, 2.8, 0.38);
figureGroup.add(rightEye);

scene.add(figureGroup);
figureGroup.visible = false;
let figureActive = false;
let figureSpawnTimer = 0;
let figureLiveTimer = 0;
let figureBasePos = new THREE.Vector3();
let isJumpscaring = false;
const jumpscareOverlay = document.getElementById('jumpscare-overlay');

function runJumpscare() {
    if (isJumpscaring) return;
    isJumpscaring = true;
    
    // Hide figure immediately so it's gone when the scare ends
    figureGroup.visible = false; 

    let flashCount = 0;
    const executeFlash = () => {
        if (flashCount >= 3) {
            jumpscareOverlay.style.display = 'none';
            isJumpscaring = false;
            figureActive = false;
            spawnFigure(); // Respawn elsewhere
            return;
        }

        // 1. Show overlay (the "split second" scare)
        jumpscareOverlay.style.display = 'flex';
        
        setTimeout(() => {
            // 2. Hide overlay
            jumpscareOverlay.style.display = 'none';
            flashCount++;
            
            // 3. Wait for the 0.2s delay before next flash
            if (flashCount < 3) {
                setTimeout(executeFlash, 50);
            } else {
                executeFlash(); // Clean up
            }
        }, 50); // Show duration
    };

    executeFlash();
}

// Dev test tools
let showDevArrow = false;
const devArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2, 0x00ff00);
scene.add(devArrow);
devArrow.visible = false;

// Pseudo-random hash for procedural walls
function hash(x, z) {
    let dot = x * 12.9898 + z * 78.233;
    let sn = Math.sin(dot) * 43758.5453;
    return sn - Math.floor(sn);
}

function isWall(gx, gz) {
    if (Math.abs(gx) < 2 && Math.abs(gz) < 2) return false; // Safe spawn zone
    
    // Create random wall clumps / pillars but leave paths open
    // We combine two checks to get nice backrooms-like walls: long segments and scattered pillars
    let val = hash(gx, gz);
    if (val > 0.70) return true;
    
    // Add some random longer straight walls
    if (hash(gx, Math.floor(gz/3)) > 0.85 && hash(gx, gz+1) > 0.5) return true;
    if (hash(Math.floor(gx/3), gz) > 0.85 && hash(gx+1, gz) > 0.5) return true;
    
    return false;
}

// Update chunks when player moves
let lastPGX = null;
let lastPGZ = null;
const dummy = new THREE.Object3D();

function updateMaze(px, pz) {
    let pgx = Math.round(px / BLOCK_SIZE);
    let pgz = Math.round(pz / BLOCK_SIZE);
    
    // Only update instances if player crossed a grid boundary
    if (pgx === lastPGX && pgz === lastPGZ) return;
    lastPGX = pgx;
    lastPGZ = pgz;

    // Follow player with the floor/ceiling 
    floor.position.set(pgx * BLOCK_SIZE, 0, pgz * BLOCK_SIZE);
    ceiling.position.set(pgx * BLOCK_SIZE, 4.0, pgz * BLOCK_SIZE);
    
    let count = 0;
    for(let dz = -RENDER_RADIUS; dz <= RENDER_RADIUS; dz++) {
        for(let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
            let cx = pgx + dx;
            let cz = pgz + dz;
            if (isWall(cx, cz)) {
                dummy.position.set(cx * BLOCK_SIZE, BLOCK_SIZE/2, cz * BLOCK_SIZE);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                instancedWalls.setMatrixAt(count++, dummy.matrix);
            }
        }
    }
    instancedWalls.count = count;
    instancedWalls.instanceMatrix.needsUpdate = true;
}

// Line of sight check using grid stepping
function checkLoS() {
    if (!figureActive) return false;
    
    const startX = camera.position.x;
    const startZ = camera.position.z;
    const endX = figureBasePos.x;
    const endZ = figureBasePos.z;
    
    const dx = endX - startX;
    const dz = endZ - startZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    const steps = Math.ceil(dist / 1.5); // Check every 1.5 units
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const testX = startX + dx * t;
        const testZ = startZ + dz * t;
        const gx = Math.round(testX / BLOCK_SIZE);
        const gz = Math.round(testZ / BLOCK_SIZE);
        if (isWall(gx, gz)) return false;
    }
    return true;
}

// Input and Movement Variables
let isDragging = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let shiftPressed = false;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const speedBase = 0.5;
const runSpeedMult = 1.8;

// Event Listeners for dragging screen
document.addEventListener('mousedown', (e) => {
    if (e.target.id === 'audio-toggle') return;
    if (e.button === 0) isDragging = true;
});
document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
});
document.addEventListener('mouseleave', () => { isDragging = false; });

// WASD Input
const onKeyDown = function ( event ) {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': shiftPressed = true; break;
    }
};

const onKeyUp = function ( event ) {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': shiftPressed = false; break;
    }
};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Collision check function against infinite grid
function checkCollision(nextPos) {
    const pSize = 0.4; // player collision radius
    
    const corners = [
        {x: nextPos.x + pSize, z: nextPos.z + pSize},
        {x: nextPos.x + pSize, z: nextPos.z - pSize},
        {x: nextPos.x - pSize, z: nextPos.z + pSize},
        {x: nextPos.x - pSize, z: nextPos.z - pSize}
    ];

    for (let c of corners) {
        let gx = Math.round(c.x / BLOCK_SIZE);
        let gz = Math.round(c.z / BLOCK_SIZE);
        if (isWall(gx, gz)) {
            // Further granular check to see which axis is blocked
            return {
                xBlock: isWall(Math.round(c.x / BLOCK_SIZE), Math.round(camera.position.z / BLOCK_SIZE)),
                zBlock: isWall(Math.round(camera.position.x / BLOCK_SIZE), Math.round(c.z / BLOCK_SIZE))
            };
        }
    }
    return {xBlock: false, zBlock: false};
}

let prevTime = performance.now();

function animate() {
    requestAnimationFrame( animate );
    const time = performance.now();
    const delta = ( time - prevTime ) / 1000;

    if (isJumpscaring) {
        prevTime = time;
        return; // Pause everything during scare
    }

    // Movement Logic
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveLeft ) - Number( moveRight );
    direction.normalize(); // consistent directions
    
    const moveSpeed = shiftPressed ? speedBase * runSpeedMult : speedBase;

    if ( moveForward || moveBackward ) velocity.z -= direction.z * moveSpeed * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * moveSpeed * delta;

    // Convert from local space to global space
    // Local forward is negative z.
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));
    
    // velocity.z goes negative when 'W' is pressed (moving forward)
    let stepX = right.x * velocity.x + forward.x * (-velocity.z);
    let stepZ = right.z * velocity.x + forward.z * (-velocity.z);
    
    const magnitude = Math.sqrt(stepX*stepX + stepZ*stepZ);
    
    if (magnitude > 0.01) {
        // Attempt X move
        let nextX = camera.position.x + stepX;
        let testPos = new THREE.Vector3(nextX, camera.position.y, camera.position.z);
        if (!checkCollision(testPos).xBlock) {
            camera.position.copy(testPos);
        } else {
            velocity.x = 0; // stop moving against wall
        }
        
        // Attempt Z move
        let nextZ = camera.position.z + stepZ;
        testPos = new THREE.Vector3(camera.position.x, camera.position.y, nextZ);
        if (!checkCollision(testPos).zBlock) {
            camera.position.copy(testPos);
        } else {
            velocity.z = 0;
        }
    }

    // Update pointlight to buzz and flicker
    pointLight.position.set(camera.position.x, 3.5, camera.position.z);
    pointLight.intensity = 0.9 + Math.random() * 0.2;

    // Figure Spawning and Update Logic
    if (!figureActive) {
        figureSpawnTimer += delta;
        // initial spawn delay
        if (figureSpawnTimer > 3.0) {
            spawnFigure();
        }
    } else {
        figureLiveTimer += delta;

        // Glitch effect: every 2 seconds, glitch for 0.15s
        let isGlitching = Math.floor(figureLiveTimer) % 2 === 0 && (figureLiveTimer % 1) < 0.15;
        
        if (isGlitching) {
            // "Twitch like crazy" effect: High-frequency small-scale jitter
            const twitch = 0.15;
            figureGroup.position.set(
                figureBasePos.x + (Math.random() - 0.5) * twitch,
                figureBasePos.y + (Math.random() - 0.5) * twitch,
                figureBasePos.z + (Math.random() - 0.5) * twitch
            );

            figureGroup.scale.set(
                1.0 + (Math.random() - 0.5) * 0.4, 
                1.0 + (Math.random() - 0.5) * 0.4, 
                1.0 + (Math.random() - 0.5) * 0.4
            );
            
            figureGroup.rotation.set(
                (Math.random() - 0.5) * 0.3,
                figureGroup.rotation.y + (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );

            figureGroup.visible = Math.random() > 0.05; 
        } else {
            figureGroup.position.copy(figureBasePos);
            figureGroup.scale.set(1, 1, 1);
            figureGroup.visible = true;
            figureGroup.rotation.z = 0;
            const target = new THREE.Vector3(camera.position.x, figureGroup.position.y, camera.position.z);
            figureGroup.lookAt(target);
        }

        const isVisible = checkLoS();
        const timeoutThreshold = isVisible ? 30.0 : 10.0;

        // Despawn/Jumpscare logic
        if (camera.position.distanceTo(figureGroup.position) < 12.0) { 
            if (isVisible) {
                runJumpscare(); 
            }
            // If LoS is blocked, no jumpscare occurs even if very close
        } else if (figureLiveTimer > timeoutThreshold) {
            // Respawn if timeout reached (10s if hidden, 30s if visible)
            figureActive = false;
            spawnFigure(); 
        }
    }

    // Update dev arrow
    if (figureActive && showDevArrow) {
        const dir = new THREE.Vector3().subVectors(figureGroup.position, camera.position).normalize();
        devArrow.setDirection(dir);
        devArrow.position.copy(camera.position).add(new THREE.Vector3(0, -0.5, -1).applyQuaternion(camera.quaternion));
        devArrow.visible = true;
    } else {
        devArrow.visible = false;
    }

    updateMaze(camera.position.x, camera.position.z);

    renderer.render( scene, camera );
    prevTime = time;
}

// Initial draw chunk load
updateMaze(camera.position.x, camera.position.z);
animate();
