const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const loadingOverlay = document.getElementById('loading-overlay');
const startBtn = document.getElementById('start-btn');
const gameMessage = document.getElementById('game-message');
const playerMoveEl = document.getElementById('player-move');
const cpuMoveEl = document.getElementById('cpu-move');
const playerScoreEl = document.getElementById('player-score');
const cpuScoreEl = document.getElementById('cpu-score');

let isGameRunning = false;
let playerScore = 0;
let cpuScore = 0;
// let lastGestureTime = 0; // 未使用，注释掉
let currentGesture = null;

// Game State
const MOVES = ['✊', '✋', '✌️'];
const MOVE_NAMES = ['Rock', 'Paper', 'Scissors'];

function onResults(results) {
    loadingOverlay.style.display = 'none';

    // 关键点1：每一帧都确保 Canvas 的内部分辨率与摄像头画面的高清分辨率一致
    // 这样画面才不会被拉伸导致的模糊
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // 关键点2：调整线条粗细
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2 // 从 5 改为 2，线条更细致
            });

            // 关键点3：调整关节点大小
            drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 1, // 描边变细
                radius: 3     // 设置点的半径，避免远距离时糊成一团
            });

            if (isGameRunning) {
                detectGesture(landmarks);
            }
        }
    }
    canvasCtx.restore();
}

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

// 关键点4：提高摄像头采集分辨率
// 虽然这里设大了，但只要你的 CSS 设置了固定宽高（例如 width: 640px），
// 画面就会显得很清晰且细腻，不会改变网页布局。
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280, // 从 640 提升到 1280 (HD)
    height: 720  // 从 480 提升到 720 (HD)
});

camera.start();

function detectGesture(landmarks) {
    // 简单的手势识别逻辑
    // 拇指 (注意：这里只针对右手做了简单判断，左手可能需要镜像逻辑)
    const thumbIsOpen = landmarks[4].x < landmarks[3].x;

    // 其他手指
    const indexIsOpen = landmarks[8].y < landmarks[6].y;
    const middleIsOpen = landmarks[12].y < landmarks[10].y;
    const ringIsOpen = landmarks[16].y < landmarks[14].y;
    const pinkyIsOpen = landmarks[20].y < landmarks[18].y;

    let gesture = null;

    // 石头
    if (!indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen) {
        gesture = 0;
    }
    // 布
    else if (indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen) {
        gesture = 1;
    }
    // 剪刀
    else if (indexIsOpen && middleIsOpen && !ringIsOpen && !pinkyIsOpen) {
        gesture = 2;
    }

    if (gesture !== null) {
        currentGesture = gesture;
        playerMoveEl.textContent = MOVES[gesture];
    }
}

startBtn.addEventListener('click', () => {
    if (!isGameRunning) {
        startGame();
    }
});

function startGame() {
    isGameRunning = true;
    startBtn.textContent = 'Playing...';
    startBtn.disabled = true;

    let count = 3;
    gameMessage.textContent = count;

    const countdown = setInterval(() => {
        count--;
        if (count > 0) {
            gameMessage.textContent = count;
        } else {
            clearInterval(countdown);
            gameMessage.textContent = 'SHOOT!';
            resolveRound();
        }
    }, 1000);
}

function resolveRound() {
    setTimeout(() => {
        const playerMove = currentGesture;
        const cpuMove = Math.floor(Math.random() * 3);

        cpuMoveEl.textContent = MOVES[cpuMove];

        if (playerMove === null) {
            gameMessage.textContent = 'No gesture detected!';
        } else {
            const result = getWinner(playerMove, cpuMove);
            if (result === 'win') {
                gameMessage.textContent = 'You Win!';
                playerScore++;
                playerScoreEl.textContent = playerScore;
            } else if (result === 'lose') {
                gameMessage.textContent = 'You Lose!';
                cpuScore++;
                cpuScoreEl.textContent = cpuScore;
            } else {
                gameMessage.textContent = 'Draw!';
            }
        }

        isGameRunning = false;
        startBtn.textContent = 'Play Again';
        startBtn.disabled = false;
    }, 500);
}

function getWinner(player, cpu) {
    if (player === cpu) return 'draw';
    if ((player === 0 && cpu === 2) ||
        (player === 1 && cpu === 0) ||
        (player === 2 && cpu === 1)) {
        return 'win';
    }
    return 'lose';
}