import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup basic scene
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Generate 4D vertices for a Tesseract (16 vertices)
const points4D = [];
for (let i = 0; i < 16; i++) {
  points4D.push([
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1
  ]);
}

// Generate the 32 edges. Two vertices are connected if they differ by exactly 1 coordinate (XOR logic).
const edges = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diff = (i ^ j);
    // Is it a power of 2? (means only 1 bit is set)
    if (diff !== 0 && (diff & (diff - 1)) === 0) {
      edges.push([i, j]);
    }
  }
}

// Main group to hold lines and spheres
const tesseractGroup = new THREE.Group();
scene.add(tesseractGroup);

// Line segments
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(edges.length * 6);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.LineBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.8,
});
const lines = new THREE.LineSegments(geometry, material);
tesseractGroup.add(lines);

// Glowing spheres at the vertices
const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const spheres = [];
for (let i = 0; i < 16; i++) {
  const mesh = new THREE.Mesh(sphereGeo, sphereMat);
  tesseractGroup.add(mesh);
  spheres.push(mesh);
}

// Project 4D to 3D
function projectTo3D(point4D) {
  const distance = 3;
  // stereographic projection from 4D to 3D
  const w = 1 / (distance - point4D[3]);

  return new THREE.Vector3(
    point4D[0] * w,
    point4D[1] * w,
    point4D[2] * w
  );
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let angleA = 0;
let angleB = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  angleA += delta * 0.5; // XW plane angle
  angleB += delta * 0.3; // YZ plane angle

  const currentVerts3D = [];

  // Calculate projected vertices for the current frame
  for (let i = 0; i < 16; i++) {
    let [x, y, z, w] = points4D[i];

    // Rotate in XW plane
    let rXW_x = x * Math.cos(angleA) - w * Math.sin(angleA);
    let rXW_w = x * Math.sin(angleA) + w * Math.cos(angleA);
    x = rXW_x;
    w = rXW_w;

    // Rotate in YZ plane
    let rYZ_y = y * Math.cos(angleB) - z * Math.sin(angleB);
    let rYZ_z = y * Math.sin(angleB) + z * Math.cos(angleB);
    y = rYZ_y;
    z = rYZ_z;

    const v3d = projectTo3D([x, y, z, w]);

    // Scale it up
    v3d.multiplyScalar(4.0);

    currentVerts3D.push(v3d);

    // Update sphere position
    spheres[i].position.copy(v3d);
  }

  // Update line segments geometry
  let posIndex = 0;
  const positionsAttr = lines.geometry.attributes.position.array;
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i][0];
    const b = edges[i][1];

    positionsAttr[posIndex++] = currentVerts3D[a].x;
    positionsAttr[posIndex++] = currentVerts3D[a].y;
    positionsAttr[posIndex++] = currentVerts3D[a].z;

    positionsAttr[posIndex++] = currentVerts3D[b].x;
    positionsAttr[posIndex++] = currentVerts3D[b].y;
    positionsAttr[posIndex++] = currentVerts3D[b].z;
  }
  lines.geometry.attributes.position.needsUpdate = true;

  // Slowly rotate the entire 3D projection for an extra layer of motion
  tesseractGroup.rotation.x = angleA * 0.2;
  tesseractGroup.rotation.y = angleB * 0.2;

  controls.update();
  renderer.render(scene, camera);
}

animate();

import { initNavigation } from './nav.js';
initNavigation('tesseract');
