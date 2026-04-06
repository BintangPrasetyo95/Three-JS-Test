import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { mobius3d } from 'three/addons/geometries/ParametricFunctions.js';

// --- Setup ---
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1, 5);

// --- Orbit controls (mouse drag to rotate) ---
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;   // smooth inertia
controls.dampingFactor = 0.05;

// --- Procedural Ladder Texture ---
function createLadderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Fill with black (fully transparent if used as alpha)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw rails and rungs in white
  ctx.fillStyle = '#ffffff';

  // Rails (along the length of the strip)
  const railThickness = 24;
  ctx.fillRect(0, 30, canvas.width, railThickness);
  ctx.fillRect(0, canvas.height - 30 - railThickness, canvas.width, railThickness);

  // Rungs (across the cross section)
  const rungSpacing = 64;
  const rungThickness = 16;
  for (let i = 0; i < canvas.width; i += rungSpacing) {
    ctx.fillRect(i, 30, rungThickness, canvas.height - 60);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 1); // Repeat 16 times around the loop
  return texture;
}

const ladderPattern = createLadderTexture();

// --- Objects ---
const geo = new ParametricGeometry(mobius3d, 300, 80);
const mat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  metalness: 0.3,
  roughness: 0.4,
  side: THREE.DoubleSide,
  alphaMap: ladderPattern,
  alphaTest: 0.5,
  transparent: true,
});
const knot = new THREE.Mesh(geo, mat);
scene.add(knot);

// --- Lights ---
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const pointLight = new THREE.PointLight(0xa78bfa, 80, 30);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const fillLight = new THREE.PointLight(0x38bdf8, 40, 30);
fillLight.position.set(-5, -3, -5);
scene.add(fillLight);

// --- Resize handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  knot.rotation.x = t * 0.4;
  knot.rotation.y = t * 0.6;

  controls.update();           // required for damping
  renderer.render(scene, camera);
}

animate();

import { initNavigation } from './nav.js';
initNavigation('mobius');