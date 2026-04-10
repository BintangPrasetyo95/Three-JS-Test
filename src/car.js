import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initNavigation } from './nav.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(15, 8, 15);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// Spotlight from above
const mainLight = new THREE.SpotLight(0xffffff, 800);
mainLight.position.set(0, 15, 0);
mainLight.angle = Math.PI / 5; // Cone-shaped
mainLight.penumbra = 0.5; // Soft edge
mainLight.decay = 2.0;
mainLight.distance = 50;
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.bias = -0.0005;
scene.add(mainLight);

// Texture loading
const textureLoader = new THREE.TextureLoader();
const concreteTexture = textureLoader.load('./src/concrete_floor.png');
concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteTexture.repeat.set(20, 20);
concreteTexture.colorSpace = THREE.SRGBColorSpace;

// Floor - solid, no squares
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x888888, // slightly lighter to let texture show
    map: concreteTexture,
    roughness: 0.9,
    metalness: 0.1,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Additional Textures loading
const carbonTexture = textureLoader.load('./src/carbon_fiber.png');
carbonTexture.wrapS = carbonTexture.wrapT = THREE.RepeatWrapping;
carbonTexture.repeat.set(4, 4);

const metalTexture = textureLoader.load('./src/brushed_metal.png');
metalTexture.wrapS = metalTexture.wrapT = THREE.RepeatWrapping;
metalTexture.repeat.set(2, 2);

// Materials
const carbonFiber = new THREE.MeshStandardMaterial({ color: 0x555555, map: carbonTexture, roughness: 0.8, metalness: 0.6 });
const metallicPaint = new THREE.MeshPhysicalMaterial({ color: 0x990011, roughness: 0.2, metalness: 0.8, clearcoat: 1.0, clearcoatRoughness: 0.1 });
const glossPaint = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.6 });
const steel = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: metalTexture, roughness: 0.3, metalness: 0.95 });
const darkGlass = new THREE.MeshPhysicalMaterial({
    color: 0x050505, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.8, transmission: 0.2
});
const neonBlue = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
const neonRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 });
const brakeMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 1.5 });

const carGroup = new THREE.Group();
carGroup.position.y = 0.7; // Lowered from 1.0 so tires perfectly touch the ground
scene.add(carGroup);

// Utility to create and add meshes quickly
function addPart(geom, mat, pos, rot = [0,0,0], castShadow = true) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    carGroup.add(mesh);
    return mesh;
}

// 1. Chassis core
addPart(new THREE.BoxGeometry(3.6, 0.5, 9), carbonFiber, [0, 0, 0]);
addPart(new THREE.BoxGeometry(3.4, 0.4, 8.8), glossPaint, [0, -0.1, 0]); 

// 2. Main Body & Cabin
addPart(new THREE.BoxGeometry(4.0, 0.8, 5.5), metallicPaint, [0, 0.6, -0.5]);
// Cabin glass
addPart(new THREE.BoxGeometry(2.8, 1.0, 3.2), darkGlass, [0, 1.4, 0.5]);
// Roof
addPart(new THREE.BoxGeometry(2.6, 0.15, 2.8), carbonFiber, [0, 1.95, 0.4]);
// A / B pillars
addPart(new THREE.CylinderGeometry(0.08, 0.08, 1.5), carbonFiber, [1.35, 1.4, 1.8], [-Math.PI/6, 0, 0]);
addPart(new THREE.CylinderGeometry(0.08, 0.08, 1.5), carbonFiber, [-1.35, 1.4, 1.8], [-Math.PI/6, 0, 0]);
addPart(new THREE.CylinderGeometry(0.08, 0.08, 1.5), carbonFiber, [1.35, 1.4, -0.8], [Math.PI/6, 0, 0]);
addPart(new THREE.CylinderGeometry(0.08, 0.08, 1.5), carbonFiber, [-1.35, 1.4, -0.8], [Math.PI/6, 0, 0]);

// 3. Fenders
const fenderGeom = new THREE.BoxGeometry(1.2, 0.8, 2.6);
addPart(fenderGeom, metallicPaint, [2.0, 0.4, 3.5]); // Front Left
addPart(fenderGeom, metallicPaint, [-2.0, 0.4, 3.5]); // Front Right
addPart(fenderGeom, metallicPaint, [2.0, 0.5, -3.2]); // Rear Left
addPart(fenderGeom, metallicPaint, [-2.0, 0.5, -3.2]); // Rear Right

// 4. Front End Details
addPart(new THREE.BoxGeometry(3.8, 0.6, 2.5), carbonFiber, [0, 0.4, 3.8]); // Hood
addPart(new THREE.BoxGeometry(4.2, 0.1, 1.5), carbonFiber, [0, 0.0, 5.0]); // Splitter

// Front vents
addPart(new THREE.BoxGeometry(1.5, 0.3, 0.5), carbonFiber, [0, 0.3, 4.8]); 
const grillGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4);
grillGeo.rotateZ(Math.PI/2);
for(let i=0; i<4; i++) {
    addPart(grillGeo, steel, [0, 0.2 + i*0.08, 4.9]);
}

// Headlights (Neon Strips)
addPart(new THREE.BoxGeometry(1.0, 0.05, 0.1), neonBlue, [1.2, 0.65, 4.9]);
addPart(new THREE.BoxGeometry(1.0, 0.05, 0.1), neonBlue, [-1.2, 0.65, 4.9]);
const hlP1 = new THREE.PointLight(0x00f0ff, 1.5, 8);
hlP1.position.set(1.2, 0.65, 5.1); carGroup.add(hlP1);
const hlP2 = new THREE.PointLight(0x00f0ff, 1.5, 8);
hlP2.position.set(-1.2, 0.65, 5.1); carGroup.add(hlP2);

// 5. Rear End & Spoilers
addPart(new THREE.BoxGeometry(3.8, 0.9, 1.5), metallicPaint, [0, 0.5, -3.8]);
addPart(new THREE.BoxGeometry(4.0, 0.1, 1.5), carbonFiber, [0, 0.0, -4.5]); // Diffuser

// Diffuser fins
for(let i=0; i<5; i++) {
    addPart(new THREE.BoxGeometry(0.05, 0.4, 1.0), carbonFiber, [-1.5 + i*0.75, -0.1, -4.6]);
}

// Massive Rear Wing
addPart(new THREE.BoxGeometry(0.1, 1.0, 0.5), carbonFiber, [1.2, 1.2, -4.2]);
addPart(new THREE.BoxGeometry(0.1, 1.0, 0.5), carbonFiber, [-1.2, 1.2, -4.2]);
addPart(new THREE.BoxGeometry(4.6, 0.1, 1.5), carbonFiber, [0, 1.7, -4.4], [-0.1, 0, 0]);

// Side Winglets
addPart(new THREE.BoxGeometry(0.1, 0.8, 1.5), metallicPaint, [2.35, 1.5, -4.4], [-0.1, 0, 0]);
addPart(new THREE.BoxGeometry(0.1, 0.8, 1.5), metallicPaint, [-2.35, 1.5, -4.4], [-0.1, 0, 0]);

// Taillights
addPart(new THREE.BoxGeometry(3.0, 0.1, 0.1), neonRed, [0, 0.8, -4.55]);
const tlP = new THREE.PointLight(0xff0033, 2, 8);
tlP.position.set(0, 0.8, -4.7); carGroup.add(tlP);

// Exposed Engine / Exhaust area
const exhaustGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16);
exhaustGeo.rotateX(Math.PI/2);
addPart(exhaustGeo, steel, [1.0, 0.4, -4.4]);
addPart(exhaustGeo, steel, [0.5, 0.4, -4.4]);
addPart(exhaustGeo, steel, [-0.5, 0.4, -4.4]);
addPart(exhaustGeo, steel, [-1.0, 0.4, -4.4]);

// Inner glow for exhaust
const innerExhaustGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.81, 16);
innerExhaustGeo.rotateX(Math.PI/2);
const exhaustGlowMat = new THREE.MeshBasicMaterial({color: 0xffaa00});
addPart(innerExhaustGeo, exhaustGlowMat, [1.0, 0.4, -4.4]);
addPart(innerExhaustGeo, exhaustGlowMat, [0.5, 0.4, -4.4]);
addPart(innerExhaustGeo, exhaustGlowMat, [-0.5, 0.4, -4.4]);
addPart(innerExhaustGeo, exhaustGlowMat, [-1.0, 0.4, -4.4]);

// Engine block visible in back
addPart(new THREE.BoxGeometry(2.0, 0.6, 1.5), steel, [0, 1.0, -2.5]);
for(let i=0; i<8; i++) {
    addPart(new THREE.CylinderGeometry(0.1, 0.1, 0.4), metallicPaint, [-0.8 + i*0.22, 1.3, -2.5]);
    addPart(new THREE.CylinderGeometry(0.04, 0.04, 0.6).rotateX(Math.PI/2), steel, [-0.8 + i*0.22, 1.4, -2.8]);
}

// Underglow LED strips (bottom edges of main chassis)
const ledMat = new THREE.MeshBasicMaterial({ color: 0x00eaff }); // Red neon
const edgeThickness = 0.08;

// Front bottom edge
addPart(new THREE.BoxGeometry(3.6, edgeThickness, edgeThickness), ledMat, [0, -0.25, 4.5]);
// Back bottom edge
addPart(new THREE.BoxGeometry(3.6, edgeThickness, edgeThickness), ledMat, [0, -0.25, -4.5]);
// Left bottom edge
addPart(new THREE.BoxGeometry(edgeThickness, edgeThickness, 9.0), ledMat, [1.8, -0.25, 0]);
// Right bottom edge
addPart(new THREE.BoxGeometry(edgeThickness, edgeThickness, 9.0), ledMat, [-1.8, -0.25, 0]);

// Add a few small point lights along the edges to actually cast the faint red glow on the ground
for (let z of [-3, 0, 3]) {
    const p1 = new THREE.PointLight(0x00eaff, 55.5, 4);
    p1.position.set(1.8, -0.25, z);
    carGroup.add(p1);

    const p2 = new THREE.PointLight(0x00eaff, 55.5, 4);
    p2.position.set(-1.8, -0.25, z);
    carGroup.add(p2);
}

// 6. Suspension and Wheels
const createWheel = () => {
    const wGroup = new THREE.Group();
    // Tire
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 48), rubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);
    // Tire treads
    for(let i=0; i<24; i++) {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.2), rubber);
        tread.position.y = 0.78;
        tread.rotation.x = 0.1; // sloped tread
        const tGroup = new THREE.Group();
        tGroup.add(tread);
        tGroup.rotation.x = (Math.PI*2 / 24) * i;
        wGroup.add(tGroup);
    }
    
    // Rim
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.72, 32), glossPaint);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    // Spokes (Cyberpunk style)
    for(let i=0; i<5; i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.15), steel);
        spoke.rotation.x = (Math.PI*2 / 5) * i;
        spoke.position.x = 0.35;
        wGroup.add(spoke);
    }
    
    // Glowing Brake Disc
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), brakeMat);
    brake.rotation.z = Math.PI / 2;
    brake.position.x = -0.15;
    wGroup.add(brake);

    return wGroup;
};

const w1 = createWheel(); w1.position.set(2.2, 0.1, 3.5); carGroup.add(w1);
const w2 = createWheel(); w2.position.set(-2.2, 0.1, 3.5); carGroup.add(w2);
const w3 = createWheel(); w3.position.set(2.3, 0.2, -3.2); w3.scale.set(1.1,1.1,1.1); carGroup.add(w3);
const w4 = createWheel(); w4.position.set(-2.3, 0.2, -3.2); w4.scale.set(1.1,1.1,1.1); carGroup.add(w4);

// Suspension details
const strGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5);
strGeo.rotateZ(Math.PI/2);
[
    [1.4, 0.1, 3.5], [-1.4, 0.1, 3.5],
    [1.4, 0.3, 3.5], [-1.4, 0.3, 3.5],
    [1.5, 0.2, -3.2], [-1.5, 0.2, -3.2],
    [1.5, 0.5, -3.2], [-1.5, 0.5, -3.2]
].forEach(pos => {
    addPart(strGeo, steel, pos);
});

// Coilover Springs (visual representation using toruses)
for(let i=0; i<5; i++) {
    addPart(new THREE.TorusGeometry(0.12, 0.03, 8, 16).rotateY(Math.PI/2), steel, [1.4, 0.1 + i*0.05, 3.5]);
    addPart(new THREE.TorusGeometry(0.12, 0.03, 8, 16).rotateY(Math.PI/2), steel, [-1.4, 0.1 + i*0.05, 3.5]);
    addPart(new THREE.TorusGeometry(0.12, 0.03, 8, 16).rotateY(Math.PI/2), steel, [1.5, 0.2 + i*0.05, -3.2]);
    addPart(new THREE.TorusGeometry(0.12, 0.03, 8, 16).rotateY(Math.PI/2), steel, [-1.5, 0.2 + i*0.05, -3.2]);
}

// 7. Micro details (Greebles)
// Adding lots of small boxes/cylinders all over the chassis to simulate complex mechanics
for(let i=0; i<80; i++) {
    const isBox = Math.random() > 0.3;
    const geom = isBox 
        ? new THREE.BoxGeometry(0.1+Math.random()*0.3, 0.05+Math.random()*0.1, 0.1+Math.random()*0.4)
        : new THREE.CylinderGeometry(0.02+Math.random()*0.03, 0.02+Math.random()*0.03, 0.1+Math.random()*0.5).rotateX(Math.random()*Math.PI);
    
    const mat = Math.random() > 0.5 ? carbonFiber : steel;
    
    // Distribute long the sides, back, and top
    const x = (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random()*0.4);
    const y = 0.1 + Math.random()*0.8;
    const z = -4 + Math.random()*8;
    
    addPart(geom, mat, [x,y,z]);
}

// 8. Event Listeners & Animation
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initNavigation('car');

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const t = clock.getElapsedTime();
    hlP1.intensity = 1.5 + Math.sin(t*3)*0.5;
    hlP2.intensity = 1.5 + Math.sin(t*3)*0.5;

    renderer.render(scene, camera);
}

animate();
