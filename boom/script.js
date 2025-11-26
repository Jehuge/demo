import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// --- Configuration ---
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const PLANET_RADIUS = 2;
const EXPLOSION_PARTICLE_COUNT = 4000; // More particles
const EXPLOSION_SPEED = 0.2;

// --- State ---
let handLandmarker = undefined;
let webcamRunning = false;
let isExploded = false;
let targetPosition = new THREE.Vector3(0, 0, 0);
let currentPosition = new THREE.Vector3(0, 0, 0);

// --- DOM Elements ---
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const loadingScreen = document.getElementById('loading');

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.02); // Add depth fog

// Generate Glow Texture
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
const glowTexture = createGlowTexture();


// Add some stars/background - Make it grander
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
const starVertices = [];
for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 200; // Wider spread
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 100 - 30;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12; // Pull back slightly for grander view

const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better colors

// Lighting - Brighter and more dramatic
const ambientLight = new THREE.AmbientLight(0x404040, 3); // Brighter ambient
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
// Add a point light near the planet for glow
const pointLight = new THREE.PointLight(0x3366ff, 5, 50);
scene.add(pointLight);


// --- Planet ---
const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x2255ff, // Slightly brighter base
    roughness: 0.4, // Shinier
    metalness: 0.3,
    emissive: 0x112244, // Self-illuminated
    emissiveIntensity: 0.5
});
// Add some noise/detail to the planet color (procedural-ish)
const colors = [];
const count = planetGeometry.attributes.position.count;
const color1 = new THREE.Color(0x00aaff); // Cyan
const color2 = new THREE.Color(0x5588ff); // Blue
const color3 = new THREE.Color(0x001133); // Dark

// We need to re-generate colors for the new geometry count
for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (r < 0.3) colors.push(color3.r, color3.g, color3.b);
    else if (r < 0.8) colors.push(color1.r, color1.g, color1.b);
    else colors.push(color2.r, color2.g, color2.b);
}
planetGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
planetMaterial.vertexColors = true;

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

// --- Explosion Particles ---
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(EXPLOSION_PARTICLE_COUNT * 3);
const particleVelocities = [];
const particleColors = new Float32Array(EXPLOSION_PARTICLE_COUNT * 3);
const particleHomeOffsets = []; // Store where each particle belongs on the surface
const particleSizes = new Float32Array(EXPLOSION_PARTICLE_COUNT); // Varied sizes

for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
    // Generate a random point on the surface of the sphere for "Home"
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    // Position on surface
    const hx = Math.sin(phi) * Math.cos(theta) * PLANET_RADIUS;
    const hy = Math.sin(phi) * Math.sin(theta) * PLANET_RADIUS;
    const hz = Math.cos(phi) * PLANET_RADIUS;

    particleHomeOffsets.push({ x: hx, y: hy, z: hz });

    // Start at center (will be updated)
    particlePositions[i * 3] = 0;
    particlePositions[i * 3 + 1] = 0;
    particlePositions[i * 3 + 2] = 0;

    // Velocity: Outward from center (normal) + random speed
    // Since home is on surface, direction is just normalized home vector
    const speed = Math.random() * 0.3 + 0.1; // Faster explosion

    particleVelocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed
    });

    // Cool colors (Cyan, Purple, White)
    const c = new THREE.Color();
    const rand = Math.random();
    if (rand < 0.3) c.setHex(0x00ffff); // Cyan
    else if (rand < 0.6) c.setHex(0xff00ff); // Purple
    else c.setHex(0xffffff); // White

    particleColors[i * 3] = c.r;
    particleColors[i * 3 + 1] = c.g;
    particleColors[i * 3 + 2] = c.b;

    particleSizes[i] = Math.random() * 0.5 + 0.1;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.3,
    map: glowTexture, // Use glow texture
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false, // Better blending
    blending: THREE.AdditiveBlending
});

const explosionSystem = new THREE.Points(particleGeometry, particleMaterial);
explosionSystem.visible = false;
scene.add(explosionSystem);


// --- MediaPipe Initialization ---
async function createHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });
    loadingScreen.style.opacity = 0;
    setTimeout(() => loadingScreen.remove(), 500);
    enableCam();
}

function enableCam() {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: VIDEO_WIDTH,
                height: VIDEO_HEIGHT
            }
        }).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
            video.classList.add('active');
        });
    }
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
    // Resize canvas to match window
    // (Handled by resize listener, but we need to ensure video is playing)

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker.detectForVideo(video, performance.now());
    }

    if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];

        // 1. Calculate Hand Position (Centroid of Palm)
        // Wrist (0), Index MCP (5), Pinky MCP (17)
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];

        // Simple average for center
        const centerX = (wrist.x + indexMCP.x + pinkyMCP.x) / 3;
        const centerY = (wrist.y + indexMCP.y + pinkyMCP.y) / 3;

        // Map 0..1 to Screen Coordinates (-1..1 for Three.js)
        // Note: MediaPipe x is 0(left) to 1(right). 
        // We mirrored the video with CSS, but the coordinates are still raw.
        // If we want it to feel like a mirror, moving hand right (your right) should move planet right.
        // Raw MP: right hand on right side of screen -> x ~ 0.
        // Let's invert X.
        const ndcX = (1 - centerX) * 2 - 1; // -1 to 1
        const ndcY = -(centerY * 2 - 1); // -1 to 1 (invert Y because 3D Y is up)

        // Map to 3D world space (at z=0)
        // Simple approximation: multiply by visible width/height at depth 0
        // Camera is at z=10.
        const dist = camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
        const visibleWidth = visibleHeight * camera.aspect;

        targetPosition.set(ndcX * (visibleWidth / 2) * 0.8, ndcY * (visibleHeight / 2) * 0.8, 0);

        // 2. Detect Fist
        // Check if fingertips are close to palm
        // Tips: 8, 12, 16, 20. Wrist: 0.
        // A simple heuristic: average distance of tips to wrist.
        const tips = [8, 12, 16, 20];
        let totalDist = 0;
        for (let i of tips) {
            const dx = landmarks[i].x - landmarks[0].x;
            const dy = landmarks[i].y - landmarks[0].y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        const avgDist = totalDist / 4;

        // Thresholds with hysteresis
        const FIST_ENTER_THRESHOLD = 0.2;
        const FIST_EXIT_THRESHOLD = 0.3;

        if (avgDist < FIST_ENTER_THRESHOLD) {
            if (!isExploded) {
                explode();
            }
        } else if (avgDist > FIST_EXIT_THRESHOLD) {
            if (isExploded) {
                reform();
            }
        }
    }

    window.requestAnimationFrame(predictWebcam);
}


// --- Animation Loop ---
let isReforming = false;

function explode() {
    isExploded = true;
    isReforming = false;
    explosionSystem.visible = true;
    planet.visible = false;

    // Reset particles to their starting position on the surface (or center? let's do surface for "shell" effect)
    // Actually, to look like an explosion, they should start where the planet IS.
    // If we want "reverse of reformation", and reformation ends at surface...
    // Let's start them at the surface.
    const positions = explosionSystem.geometry.attributes.position.array;
    for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
        positions[i * 3] = planet.position.x + particleHomeOffsets[i].x;
        positions[i * 3 + 1] = planet.position.y + particleHomeOffsets[i].y;
        positions[i * 3 + 2] = planet.position.z + particleHomeOffsets[i].z;
    }
    explosionSystem.geometry.attributes.position.needsUpdate = true;
}

function reform() {
    isReforming = true;
    // Don't show planet yet
}

function animate() {
    requestAnimationFrame(animate);

    // Smooth movement
    currentPosition.lerp(targetPosition, 0.1);

    if (!isExploded && !isReforming) {
        planet.position.copy(currentPosition);
        planet.rotation.y += 0.005;
        planet.rotation.x += 0.002;
        // Move light with planet
        pointLight.position.copy(currentPosition);
    } else if (isReforming) {
        // Reforming animation: Pull particles back to their HOME position on surface
        const positions = explosionSystem.geometry.attributes.position.array;
        let maxDistSq = 0;

        for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            const px = positions[i * 3];
            const py = positions[i * 3 + 1];
            const pz = positions[i * 3 + 2];

            // Target is planet center + home offset
            const tx = currentPosition.x + particleHomeOffsets[i].x;
            const ty = currentPosition.y + particleHomeOffsets[i].y;
            const tz = currentPosition.z + particleHomeOffsets[i].z;

            // Vector to target
            const dx = tx - px;
            const dy = ty - py;
            const dz = tz - pz;

            // Move towards target
            // Use a constant speed or fast lerp to simulate "rewind"
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const speed = 0.4; // Faster reforming

            if (dist < speed) {
                positions[i * 3] = tx;
                positions[i * 3 + 1] = ty;
                positions[i * 3 + 2] = tz;
            } else {
                positions[i * 3] += (dx / dist) * speed;
                positions[i * 3 + 1] += (dy / dist) * speed;
                positions[i * 3 + 2] += (dz / dist) * speed;
            }

            if (dist > maxDistSq) maxDistSq = dist;
        }
        explosionSystem.geometry.attributes.position.needsUpdate = true;

        // If particles are close enough, snap to solid planet
        if (maxDistSq < 0.5) {
            isReforming = false;
            isExploded = false;
            explosionSystem.visible = false;
            planet.visible = true;
            planet.position.copy(currentPosition);
            pointLight.position.copy(currentPosition);
        }

    } else {
        // Exploding animation
        const positions = explosionSystem.geometry.attributes.position.array;
        for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            positions[i * 3] += particleVelocities[i].x;
            positions[i * 3 + 1] += particleVelocities[i].y;
            positions[i * 3 + 2] += particleVelocities[i].z;

            // No gravity
        }
        explosionSystem.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start
createHandLandmarker();
animate();
