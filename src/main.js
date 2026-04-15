import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initNavigation } from './nav.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
scene.fog = new THREE.FogExp2(0x020205, 0.05);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 20, 80); 

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false; 
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.enablePan = false;
controls.enabled = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 800);
spotLight.position.set(15, 25, 15);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.6;
spotLight.decay = 2;
spotLight.distance = 100;
spotLight.castShadow = true;
scene.add(spotLight);

const rimLight = new THREE.SpotLight(0x38bdf8, 400); 
rimLight.position.set(-20, 15, -20);
rimLight.angle = Math.PI / 4;
rimLight.penumbra = 1;
rimLight.decay = 2;
scene.add(rimLight);

// Floor
const textureLoader = new THREE.TextureLoader();
const concreteTexture = textureLoader.load('./img/concrete_floor.png');
concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteTexture.repeat.set(10, 10);

const floorMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    map: concreteTexture,
    roughness: 0.9,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Intro and Landing UI state
let introFinished = false;
let introStarted = false;
let targetIntroDistance = 3.5; // Much closer as requested
let currentZoomDistance = camera.position.distanceTo(new THREE.Vector3(0, 5, 0));
const heroOverlay = document.getElementById('hero-overlay');
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');

// Loading Manager
const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    if (progressBar) progressBar.style.width = progress + '%';
    if (loadingText) loadingText.textContent = `Loading Assets: ${Math.round(progress)}%`;
};

loadingManager.onLoad = () => {
    setTimeout(() => {
        if (preloader) preloader.classList.add('fade-out');
        setTimeout(() => {
            if (preloader) preloader.style.display = 'none';
            introStarted = true; // Kick off camera animation after fade
        }, 1000);
    }, 500);
};

// Load Model
const loader = new GLTFLoader(loadingManager);
let model;

loader.load(
    './src/stylized_wooden_human_statue/scene.gltf',
    (gltf) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.position.y -= box.min.y;
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(model);
        controls.target.set(0, size.y / 2.5, 0);
    }
);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initNavigation('home');

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    if (introStarted && !introFinished) {
        currentZoomDistance = THREE.MathUtils.lerp(currentZoomDistance, targetIntroDistance, 0.015);
        if (Math.abs(currentZoomDistance - targetIntroDistance) < 0.05) {
            introFinished = true;
            if (heroOverlay) heroOverlay.classList.add('visible');
            controls.enabled = true;
        }
    } else if (introFinished) {
        const scrollY = window.scrollY;
        const targetPosY = (scrollY * 0.01);
        controls.target.y = THREE.MathUtils.lerp(controls.target.y, (model ? (3 / 2.5) : 0) + targetPosY, 0.1);
        
        const scrollDist = targetIntroDistance + (scrollY * 0.02);
        currentZoomDistance = THREE.MathUtils.lerp(currentZoomDistance, scrollDist, 0.1);
    }

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(currentZoomDistance));

    controls.update();
    renderer.render(scene, camera);
}

// Fade in UI on scroll
const showcase = document.getElementById('showcase');
window.addEventListener('scroll', () => {
  if (!showcase) return;
  const rect = showcase.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.8) {
    showcase.classList.add('reveal');
  }
});

animate();