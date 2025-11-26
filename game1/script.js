const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('game-canvas');
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let width, height;
let gameActive = false;
let score = 0;
let lives = 3;
let lastTime = 0;

// Game Objects
let fruits = [];
let particles = [];
let bladeTrail = [];
const MAX_TRAIL_LENGTH = 10;

// Audio (Optional - placeholders)
// const sliceSound = new Audio('slice.mp3');

// Resize handling
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvasElement.width = width;
    canvasElement.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- Game Classes ---

class Fruit {
    constructor() {
        this.x = Math.random() * (width - 100) + 50;
        this.y = height + 50;
        // Throw upwards with some horizontal variation
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -(Math.random() * 5 + 10); // Initial upward velocity
        this.radius = 30;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.sliced = false;
        this.type = Math.random() > 0.9 ? 'bomb' : 'fruit'; // 10% chance of bomb
        if (this.type === 'bomb') {
            this.color = '#000000';
            this.radius = 40;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravity
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'bomb') {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            // Fuse
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.quadraticCurveTo(10, -this.radius - 10, 15, -this.radius - 5);
            ctx.strokeStyle = '#d4a373';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Spark
            ctx.beginPath();
            ctx.arc(15, -this.radius - 5, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4500';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            // Highlight
            ctx.beginPath();
            ctx.arc(-5, -5, this.radius / 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- MediaPipe Setup ---

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

// --- Game Logic ---

function onResults(results) {
    // Clear canvas
    canvasCtx.clearRect(0, 0, width, height);

    // Draw game background (optional, if we want something other than CSS background)
    // canvasCtx.fillStyle = 'rgba(15, 15, 26, 0.8)';
    // canvasCtx.fillRect(0, 0, width, height);

    // Draw video feed in bottom-left corner
    // Since canvas is mirrored via CSS (scaleX(-1)), "Left" on screen is "Right" on canvas.
    // So we draw at x = width - videoWidth
    const videoWidth = width * 0.25; // 25% of screen width
    const videoHeight = (videoWidth / results.image.width) * results.image.height;
    const videoX = width - videoWidth - 20; // 20px padding
    const videoY = height - videoHeight - 20; // 20px padding

    canvasCtx.save();
    // Draw a border/background for the video
    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(videoX - 5, videoY - 5, videoWidth + 10, videoHeight + 10);
    canvasCtx.strokeStyle = 'var(--primary-color)'; // Won't work directly in canvas, use hex
    canvasCtx.strokeStyle = '#ff0055';
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeRect(videoX - 5, videoY - 5, videoWidth + 10, videoHeight + 10);

    canvasCtx.drawImage(results.image, videoX, videoY, videoWidth, videoHeight);
    canvasCtx.restore();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        // Index finger tip is landmark 8
        const indexTip = landmarks[8];

        // Map coordinates to full screen
        const x = indexTip.x * width;
        const y = indexTip.y * height;

        updateBlade(x, y);
    } else {
        // Clear trail if hand lost
        bladeTrail = [];
    }

    if (gameActive) {
        updateGame();
        drawGame(canvasCtx);
    }
}

function updateBlade(x, y) {
    bladeTrail.push({ x, y });
    if (bladeTrail.length > MAX_TRAIL_LENGTH) {
        bladeTrail.shift();
    }
}

function updateGame() {
    // Spawn fruits
    if (Math.random() < 0.03) { // Adjust spawn rate
        fruits.push(new Fruit());
    }

    // Update fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i];
        f.update();

        // Remove if out of bounds
        if (f.y > height + 100) {
            fruits.splice(i, 1);
            if (!f.sliced && f.type !== 'bomb') {
                // Missed fruit logic (optional: lose life?)
            }
            continue;
        }

        // Check collision with blade
        if (!f.sliced && bladeTrail.length > 1) {
            const tip = bladeTrail[bladeTrail.length - 1];
            const prev = bladeTrail[bladeTrail.length - 2];

            // Simple distance check to the line segment of the last blade movement
            // For simplicity, just check distance to tip for now, or interpolate
            const dist = Math.hypot(tip.x - f.x, tip.y - f.y);

            // Check if blade is moving fast enough (optional)
            const speed = Math.hypot(tip.x - prev.x, tip.y - prev.y);

            if (dist < f.radius + 10 && speed > 5) {
                sliceFruit(f, i);
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function sliceFruit(fruit, index) {
    fruit.sliced = true;

    if (fruit.type === 'bomb') {
        gameOver();
    } else {
        score += 10;
        scoreElement.textContent = score;

        // Create particles
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(fruit.x, fruit.y, fruit.color));
        }

        // Remove fruit
        fruits.splice(index, 1);
    }
}

function drawGame(ctx) {
    // Draw fruits
    fruits.forEach(f => f.draw(ctx));

    // Draw particles
    particles.forEach(p => p.draw(ctx));

    // Draw blade trail
    if (bladeTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
        for (let i = 1; i < bladeTrail.length; i++) {
            // Smooth curve
            const p0 = bladeTrail[i - 1];
            const p1 = bladeTrail[i];
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }
        ctx.lineTo(bladeTrail[bladeTrail.length - 1].x, bladeTrail[bladeTrail.length - 1].y);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'cyan';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function startGame() {
    gameActive = true;
    score = 0;
    scoreElement.textContent = score;
    fruits = [];
    particles = [];
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    // Ensure camera is running
    camera.start();
}

function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.add('active');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize camera but don't start game loop logic until clicked
camera.start();
