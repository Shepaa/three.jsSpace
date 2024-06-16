import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import {parameters} from './utilities/parameters.js';

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const pointer = new THREE.Vector2();
let geometry = null;
let material = null;
let particles = null;

let raycaster, intersects;

const threshold = 0.02;

raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
raycaster.params.Points.threshold = threshold;

window.addEventListener('click', (event) => onParticleClick(event));

function onParticleClick(event) {
  onPointerMove(event);

  raycaster.setFromCamera(pointer, camera);
  intersects = raycaster.intersectObject(particles);

  const particlesPositionArray = particles.geometry.attributes.position.array;

  const r = Math.random();
  const g = Math.random();
  const b = Math.random();

  if (intersects.length > 0) {
    let closestIntersect = null;

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].distanceToRay <= parameters.size) {
        closestIntersect = intersects[i];
        break;
      }
    }

    if (closestIntersect) {
      const closestPoint = closestIntersect.point;

      for (let i = 0; i < particlesPositionArray.length; i += 3) {
        const x = particlesPositionArray[i];
        const y = particlesPositionArray[i + 1];
        const z = particlesPositionArray[i + 2];
        const neighParticle = new THREE.Vector3(x, y, z);

        if (neighParticle.distanceTo(closestPoint) < 1.0) {
          particles.geometry.attributes.color.setXYZ(i / 3, r, g, b);
        }
      }

      const colors = particles.geometry.attributes.color;

      colors.needsUpdate = true;
    }
  }
}


gui.add(parameters, 'count').
min(100).
max(10000).
step(100).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'size').
min(0.001).
max(0.1).
step(0.001).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'radius').
min(0.01).
max(10).
step(0.01).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'branches').
min(1).
max(20).
step(1).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'spin').
min(-5).
max(5).
step(0.001).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'randomness').
min(0).
max(2).
step(0.01).
onFinishChange(() => generateGalaxy());
gui.add(parameters, 'randomnessPower').
min(1).
max(10).
step(0.001).
onFinishChange(() => generateGalaxy());
gui.addColor(parameters, 'insideColor').onFinishChange(() => generateGalaxy());
gui.addColor(parameters, 'outsideColor').onFinishChange(() => generateGalaxy());

const generateGalaxy = () => {
  // Destroy old galaxy
  if (particles !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(particles);
  }
  geometry = new THREE.BufferGeometry();
  const position = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const insideColor = new THREE.Color(parameters.insideColor);
  const outsideColor = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const branchesAngle = (i % parameters.branches) / parameters.branches *
        Math.PI * 2;
    const radius = Math.random() * parameters.radius;
    const angleSpin = parameters.spin * radius;
    const randomX = Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    position[i3] = Math.cos(branchesAngle + angleSpin) * radius + randomX;
    position[i3 + 1] = randomY;
    position[i3 + 2] = Math.sin(branchesAngle + angleSpin) * radius + randomZ;

    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

  }
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  /**
   * Material
   */

  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
};

generateGalaxy();
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1,
    100);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();