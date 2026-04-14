import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initNavigation } from './nav.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.05);

// Camera starts FAR away for the intro animation
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(50, 30, 100);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enableZoom = false; // Using custom smooth zoom
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1000);
spotLight.position.set(10, 20, 10);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.5;
spotLight.decay = 2;
spotLight.distance = 100;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const rimLight = new THREE.SpotLight(0x38bdf8, 500); // Faint blue rim light
rimLight.position.set(-15, 10, -15);
rimLight.angle = Math.PI / 4;
rimLight.penumbra = 1;
rimLight.decay = 2;
rimLight.distance = 50;
scene.add(rimLight);

// Floor
const textureLoader = new THREE.TextureLoader();
const concreteTexture = textureLoader.load('./img/concrete_floor.png');
concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteTexture.repeat.set(10, 10);

const floorMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    map: concreteTexture,
    roughness: 0.8,
    metalness: 0.2,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Intro state
let introFinished = false;
let targetIntroDistance = 3; // Closer cinematic distance
let currentZoomDistance = camera.position.distanceTo(new THREE.Vector3(0, 5, 0));
let userZoomDistance = targetIntroDistance;

// Load Model
const loader = new GLTFLoader();
let model;

loader.load(
    './src/stylized_wooden_human_statue/scene.gltf',
    (gltf) => {
        model = gltf.scene;

        // Scale and center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Adjust position so feet are on the floor
        model.position.y -= box.min.y;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Enhance the wooden texture if needed
                if (child.material) {
                    child.material.roughness = 0.7;
                    child.material.metalness = 0.1;
                }
            }
        });

        scene.add(model);

        // Set orbit target to center of model
        controls.target.set(0, size.y / 2, 0);
    },
    undefined,
    (error) => {
        console.error('An error happened while loading the model:', error);
    }
);

// Custom smooth zoom logic
window.addEventListener('wheel', (e) => {
    if (!introFinished) return; // Disable zoom during intro

    e.preventDefault();
    const zoomStrength = 0.02;
    userZoomDistance += e.deltaY * zoomStrength;
    userZoomDistance = THREE.MathUtils.clamp(userZoomDistance, 2, 50);
}, { passive: false });

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initNavigation('statue');

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Smooth Intro logic
    if (!introFinished) {
        // Lerp camera from far to near
        currentZoomDistance = THREE.MathUtils.lerp(currentZoomDistance, targetIntroDistance, 0.015);
        if (Math.abs(currentZoomDistance - targetIntroDistance) < 0.1) {
            introFinished = true;
            userZoomDistance = currentZoomDistance;
        }
    } else {
        // Smooth zoom handling after intro
        currentZoomDistance = THREE.MathUtils.lerp(currentZoomDistance, userZoomDistance, 0.1);
    }

    // Apply distance along the camera-target vector
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(currentZoomDistance));

    controls.update();
    renderer.render(scene, camera);
}

animate();
