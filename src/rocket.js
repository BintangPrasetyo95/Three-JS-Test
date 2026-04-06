import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initNavigation } from './nav.js';

// Setup background and basic components
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(10, 5, -15);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Build the Rocket
const rocketGroup = new THREE.Group();
rocketGroup.position.set(0, 0, 0);
rocketGroup.scale.set(1.5, 1.5, 1.5); // Make it 50% bigger
scene.add(rocketGroup);

// Materials for the new detailed look
const hullMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, // Light colored / shiny white
  metalness: 0.3,
  roughness: 0.2
});
const detailMat = new THREE.MeshStandardMaterial({
  color: 0x333344,
  metalness: 0.8,
  roughness: 0.4
});
const redMat = new THREE.MeshStandardMaterial({
  color: 0xff3838,
  metalness: 0.4,
  roughness: 0.5
});

// Rocket Body
const bodyGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 32);
const bodyMesh = new THREE.Mesh(bodyGeo, hullMat);
bodyMesh.rotation.x = Math.PI / 2;
rocketGroup.add(bodyMesh);

// Nose
const noseGeo = new THREE.ConeGeometry(0.6, 1.5, 32);
const noseMesh = new THREE.Mesh(noseGeo, redMat);
noseMesh.position.z = 2.25;
noseMesh.rotation.x = Math.PI / 2;
rocketGroup.add(noseMesh);

// Metallic Ring separating Nose and Body
const ringGeo = new THREE.TorusGeometry(0.6, 0.05, 16, 32);
const ringMesh = new THREE.Mesh(ringGeo, detailMat);
ringMesh.position.z = 1.5;
rocketGroup.add(ringMesh);

// Body Stripes
const stripeGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.2, 32);
const stripeMesh1 = new THREE.Mesh(stripeGeo, redMat);
stripeMesh1.position.z = 0.5;
stripeMesh1.rotation.x = Math.PI / 2;
rocketGroup.add(stripeMesh1);

const stripeMesh2 = new THREE.Mesh(stripeGeo, detailMat);
stripeMesh2.position.z = -0.5;
stripeMesh2.rotation.x = Math.PI / 2;
rocketGroup.add(stripeMesh2);

// Glass Window (Porthole)
const windowGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
const windowGlassMat = new THREE.MeshStandardMaterial({ color: 0x11bbff, metalness: 0.9, roughness: 0.1 });
const windowMesh = new THREE.Mesh(windowGeo, windowGlassMat);
windowMesh.position.set(0, 0.72, 0.5); // On top of the body
rocketGroup.add(windowMesh);

// Window Frame
const windowFrameGeo = new THREE.TorusGeometry(0.4, 0.05, 16, 32);
const windowFrameMesh = new THREE.Mesh(windowFrameGeo, detailMat);
windowFrameMesh.position.set(0, 0.72, 0.5);
windowFrameMesh.rotation.x = Math.PI / 2;
rocketGroup.add(windowFrameMesh);

// Engine Thruster Nozzle
const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.65, 0.5, 32);
const nozzleMesh = new THREE.Mesh(nozzleGeo, detailMat);
nozzleMesh.position.z = -1.75;
nozzleMesh.rotation.x = Math.PI / 2;
rocketGroup.add(nozzleMesh);

// Fins
const finGeo = new THREE.BoxGeometry(0.1, 1.8, 1.2);
for (let i = 0; i < 4; i++) {
  const finGroup = new THREE.Group();

  const fin = new THREE.Mesh(finGeo, redMat);
  fin.position.x = 0.9;
  fin.position.y = -0.4;
  fin.position.z = -0.2;
  fin.rotation.z = Math.PI / 8; // Swept angle look

  finGroup.add(fin);
  finGroup.position.z = -1.2;
  finGroup.rotation.z = (Math.PI / 2) * i;
  rocketGroup.add(finGroup);
}

// Flame (Thrust)
const flameGeo = new THREE.ConeGeometry(0.6, 2, 16);
// Shift geometry origin so it scales from the base
flameGeo.translate(0, -1, 0);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7 });
const flameMesh = new THREE.Mesh(flameGeo, flameMat);
flameMesh.position.z = -2.0; // Pushed back to match the new thruster nozzle
flameMesh.rotation.x = Math.PI / 2;
rocketGroup.add(flameMesh);

// Inner hotter flame
const hotFlameGeo = new THREE.ConeGeometry(0.3, 1.2, 16);
hotFlameGeo.translate(0, -0.6, 0);
const hotFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
const hotFlameMesh = new THREE.Mesh(hotFlameGeo, hotFlameMat);
hotFlameMesh.position.z = -2.0;
hotFlameMesh.rotation.x = Math.PI / 2;
rocketGroup.add(hotFlameMesh);


// Trail System (Wide Flat Ribbon)
const trailCount = 200;
const trailGeo = new THREE.BufferGeometry();
// We need 2 vertices (left and right edge) per history step
const trailPos = new Float32Array(trailCount * 2 * 3);
const trailColors = new Float32Array(trailCount * 2 * 3);
const trailBasePos = new Float32Array(trailCount * 3); // Pure history

// Initialize all base history to rocket start position
for (let i = 0; i < trailCount; i++) {
  trailBasePos[i * 3 + 0] = rocketGroup.position.x;
  trailBasePos[i * 3 + 1] = rocketGroup.position.y;
  trailBasePos[i * 3 + 2] = rocketGroup.position.z;
}

// Generate indices to connect the vertices into triangles (a ribbon)
const indices = [];
for (let i = 0; i < trailCount - 1; i++) {
  const v1 = i * 2;
  const v2 = i * 2 + 1;
  const v3 = (i + 1) * 2;
  const v4 = (i + 1) * 2 + 1;

  indices.push(v1, v2, v3);
  indices.push(v2, v4, v3);
}
trailGeo.setIndex(indices);
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

const trailMat = new THREE.MeshBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide
});
const trailMesh = new THREE.Mesh(trailGeo, trailMat);
scene.add(trailMesh);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const engineLight = new THREE.PointLight(0xffaa00, 2, 15);
engineLight.position.set(0, 0, -2.5); // Push light deeper into the prolonged nozzle
rocketGroup.add(engineLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let simTime = 0;
let simSpeed = 1.0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  simTime += dt * simSpeed;
  const t = simTime;

  // Make the rocket hover, wag, and fly in a slightly wobbly path
  rocketGroup.position.y = Math.sin(t * 2) * 1.5;
  rocketGroup.position.x = Math.cos(t * 1.5) * 1;
  // Tilt the nose into the turn
  rocketGroup.rotation.x = Math.sin(t * 2) * 0.1;
  rocketGroup.rotation.y = -Math.sin(t * 1.5) * 0.1;
  // Constantly spin along the main axis
  rocketGroup.rotation.z = t * 10;

  // Throttle animation (flickering flame)
  flameMesh.scale.y = 1 + Math.random() * 9;
  flameMesh.scale.x = 1 + Math.random() * 0.1;
  flameMesh.scale.z = 1 + Math.random() * 0.1;

  hotFlameMesh.scale.y = 1 + Math.random() * 9;
  engineLight.intensity = 1 + Math.random() * 1.5;

  // --- Update trail ---

  // 1. Shift the HISTORY (base path) backwards without any applied wind
  for (let i = trailCount - 1; i > 0; i--) {
    trailBasePos[i * 3 + 0] = trailBasePos[(i - 1) * 3 + 0];
    trailBasePos[i * 3 + 1] = trailBasePos[(i - 1) * 3 + 1];

    // Simulate forward speed by pushing the world points completely backwards in Z
    trailBasePos[i * 3 + 2] = trailBasePos[(i - 1) * 3 + 2] - (0.5 * simSpeed);
  }

  // 2. Newest history point originates strictly at the nozzle using world coordinates
  const nozzleWorldPos = new THREE.Vector3();
  flameMesh.getWorldPosition(nozzleWorldPos);

  trailBasePos[0] = nozzleWorldPos.x;
  trailBasePos[1] = nozzleWorldPos.y;
  trailBasePos[2] = nozzleWorldPos.z;

  // 3. Write into the actual render buffer by creating a wide flat ribbon (Billboarded)
  const positions = trailMesh.geometry.attributes.position.array;
  const colors = trailMesh.geometry.attributes.color.array;
  const colorObj = new THREE.Color();
  const cameraPos = camera.position;
  const tangent = new THREE.Vector3(0, 0, 1); // Trail naturally flows backwards along Z
  const pointVec = new THREE.Vector3();
  const toCamera = new THREE.Vector3();
  const sideVec = new THREE.Vector3();

  for (let i = 0; i < trailCount; i++) {
    const halfWidth = 0.5 * (1 - (i / trailCount));

    // Nyan Cat flowing rainbow
    let hue = ((i / trailCount) * 1.5 - t * 1.0) % 1.0;
    if (hue < 0) hue += 1.0;
    colorObj.setHSL(hue, 1.0, 0.5);

    colors[(i * 2) * 3 + 0] = colorObj.r;
    colors[(i * 2) * 3 + 1] = colorObj.g;
    colors[(i * 2) * 3 + 2] = colorObj.b;

    colors[(i * 2 + 1) * 3 + 0] = colorObj.r;
    colors[(i * 2 + 1) * 3 + 1] = colorObj.g;
    colors[(i * 2 + 1) * 3 + 2] = colorObj.b;

    pointVec.set(trailBasePos[i * 3 + 0], trailBasePos[i * 3 + 1], trailBasePos[i * 3 + 2]);
    toCamera.subVectors(cameraPos, pointVec).normalize();

    // Cross product creates a vector perpendicular to both the trail direction and the view vector
    sideVec.crossVectors(tangent, toCamera).normalize();

    // Fallback if camera is looking perfectly down the trail axis
    if (sideVec.lengthSq() < 0.001) {
      sideVec.set(1, 0, 0);
    }

    // Left vertex
    positions[(i * 2) * 3 + 0] = pointVec.x - sideVec.x * halfWidth;
    positions[(i * 2) * 3 + 1] = pointVec.y - sideVec.y * halfWidth;
    positions[(i * 2) * 3 + 2] = pointVec.z - sideVec.z * halfWidth;

    // Right vertex
    positions[(i * 2 + 1) * 3 + 0] = pointVec.x + sideVec.x * halfWidth;
    positions[(i * 2 + 1) * 3 + 1] = pointVec.y + sideVec.y * halfWidth;
    positions[(i * 2 + 1) * 3 + 2] = pointVec.z + sideVec.z * halfWidth;
  }

  trailMesh.geometry.attributes.position.needsUpdate = true;
  trailMesh.geometry.attributes.color.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

// --- UI Controls ---
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.bottom = '30px';
uiContainer.style.left = '30px';
uiContainer.style.background = 'rgba(15, 15, 20, 0.6)';
uiContainer.style.backdropFilter = 'blur(16px)';
uiContainer.style.WebkitBackdropFilter = 'blur(16px)';
uiContainer.style.padding = '20px';
uiContainer.style.borderRadius = '16px';
uiContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
uiContainer.style.color = '#fff';
uiContainer.style.fontFamily = 'Inter, sans-serif';
uiContainer.style.display = 'flex';
uiContainer.style.flexDirection = 'column';
uiContainer.style.gap = '15px';
uiContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
document.body.appendChild(uiContainer);

// Reusable Button Component for UI
function createToggleButton(text, defaultState, onChange) {
  const btn = document.createElement('div');
  btn.textContent = text;
  btn.style.padding = '8px 16px';
  btn.style.borderRadius = '8px';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '14px';
  btn.style.fontWeight = '600';
  btn.style.textAlign = 'center';
  btn.style.transition = 'all 0.2s ease';
  btn.style.userSelect = 'none';
  btn.style.flex = '1'; // fill available space evenly

  let isActive = defaultState;

  const updateStyle = () => {
    if (isActive) {
      btn.style.background = 'rgba(56, 189, 248, 0.15)';
      btn.style.color = '#38bdf8';
      btn.style.border = '1px solid rgba(56, 189, 248, 0.4)';
      btn.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.2)';
    } else {
      btn.style.background = 'rgba(255, 255, 255, 0.03)';
      btn.style.color = '#666';
      btn.style.border = '1px solid rgba(255, 255, 255, 0.05)';
      btn.style.boxShadow = 'none';
    }
  };

  updateStyle();

  btn.addEventListener('click', () => {
    isActive = !isActive;
    updateStyle();
    onChange(isActive);
  });

  return btn;
}

const buttonsRow = document.createElement('div');
buttonsRow.style.display = 'flex';
buttonsRow.style.gap = '10px';
uiContainer.appendChild(buttonsRow);

const flameBtn = createToggleButton('Flame', true, (active) => {
  flameMesh.visible = active;
  hotFlameMesh.visible = active;
  engineLight.visible = active;
});
buttonsRow.appendChild(flameBtn);

const trailBtn = createToggleButton('Trail', true, (active) => {
  trailMesh.visible = active;
  if (active) {
    for (let i = 0; i < trailCount; i++) {
      trailBasePos[i * 3 + 0] = rocketGroup.position.x;
      trailBasePos[i * 3 + 1] = rocketGroup.position.y;
      trailBasePos[i * 3 + 2] = rocketGroup.position.z;
    }
  }
});
buttonsRow.appendChild(trailBtn);

// Speed Slider
const speedContainer = document.createElement('div');
speedContainer.style.display = 'flex';
speedContainer.style.flexDirection = 'column';
speedContainer.style.gap = '8px';
speedContainer.style.marginTop = '10px';

const speedLabelContainer = document.createElement('div');
speedLabelContainer.style.display = 'flex';
speedLabelContainer.style.justifyContent = 'space-between';

const speedLabel = document.createElement('span');
speedLabel.textContent = 'Simulation Speed';
speedLabel.style.fontSize = '12px';
speedLabel.style.color = '#a0a0b0';
speedLabelContainer.appendChild(speedLabel);

const speedValueDisplay = document.createElement('span');
speedValueDisplay.textContent = '1.0x';
speedValueDisplay.style.fontSize = '12px';
speedValueDisplay.style.color = '#38bdf8';
speedValueDisplay.style.fontWeight = 'bold';
speedLabelContainer.appendChild(speedValueDisplay);

speedContainer.appendChild(speedLabelContainer);

const speedSlider = document.createElement('input');
speedSlider.type = 'range';
speedSlider.min = '0';
speedSlider.max = '300';
speedSlider.value = '100';
speedContainer.appendChild(speedSlider);
uiContainer.appendChild(speedContainer);

speedSlider.addEventListener('input', (e) => {
  let val = e.target.value / 100;
  if (val < 0.05) val = 0.05; // Prevent complete 0
  simSpeed = val;
  speedValueDisplay.textContent = val.toFixed(1) + 'x';
});

// Ensure the UI is injected
initNavigation('rocket');
animate();
