// 使用全局 THREE 对象

// --- 配置 ---
const CONFIG = {
    cameraZ: 12,
    pinchThreshold: 0.08,
    snapDistance: 1.5,
    rotationSpeed: 5.0,
    colors: {
        background: 0x050510,
        grid: 0x004444,
        hologram: 0x00ffff,
        hologramHover: 0xffd700,
        hologramGrabbed: 0xff4444,
        success: 0x00ff00
    }
};

// --- 全局状态 ---
const state = {
    isPinching: false,
    handPosition: new THREE.Vector3(),
    handRotation: new THREE.Quaternion(),
    grabbedPiece: null,
    pieces: []
};

// --- Three.js 设置 ---
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.background);
scene.fog = new THREE.Fog(CONFIG.colors.background, 10, 30);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, CONFIG.cameraZ);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00ffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xff00ff, 0.5);
pointLight.position.set(-5, 5, -5);
scene.add(pointLight);

// 环境
const gridHelper = new THREE.GridHelper(30, 30, CONFIG.colors.hologram, CONFIG.colors.grid);
scene.add(gridHelper);

// --- 游戏对象 ---

// 光标
const cursorGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
const cursorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
scene.add(cursor);

class CarPart {
    constructor(id, geometry, targetPos, startPos) {
        this.id = id;
        this.targetPos = targetPos;
        this.isSnapped = false;

        // 全息材质
        this.material = new THREE.MeshPhongMaterial({
            color: CONFIG.colors.hologram,
            emissive: 0x004444,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.7,
            wireframe: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(startPos);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 目标幽灵
        const ghostMat = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.hologram,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.targetMesh = new THREE.Mesh(geometry, ghostMat);
        this.targetMesh.position.copy(targetPos);

        scene.add(this.mesh);
        scene.add(this.targetMesh);
    }

    update() {
        if (this.isSnapped) {
            this.mesh.rotation.y += 0.01; // 空闲动画
            return;
        }

        const distanceToCursor = this.mesh.position.distanceTo(state.handPosition);
        const isHovered = distanceToCursor < 1.5;

        if (state.grabbedPiece === this) {
            // 拖拽中
            // 平滑插值位置
            this.mesh.position.lerp(state.handPosition, 0.2);

            // 应用手部旋转（简化版：目前仅基于手部翻滚/偏航近似值的Y轴）
            // 或者如果我们计算得好，可以直接复制手部四元数
            // 目前，让它通过旋转到目标方向或用户控制来看起来很酷
            this.mesh.quaternion.slerp(state.handRotation, 0.1);

            this.material.color.setHex(CONFIG.colors.hologramGrabbed);
            this.material.emissive.setHex(0xff0000);

            // 吸附预览
            if (this.mesh.position.distanceTo(this.targetPos) < CONFIG.snapDistance) {
                this.material.color.setHex(CONFIG.colors.success);
                this.material.emissive.setHex(0x00ff00);
            }
        } else if (isHovered && !state.grabbedPiece) {
            this.material.color.setHex(CONFIG.colors.hologramHover);
            this.material.emissive.setHex(0x444400);
            if (state.isPinching) {
                state.grabbedPiece = this;
            }
        } else {
            this.material.color.setHex(CONFIG.colors.hologram);
            this.material.emissive.setHex(0x004444);
        }
    }

    release() {
        if (state.grabbedPiece === this) {
            state.grabbedPiece = null;
            if (this.mesh.position.distanceTo(this.targetPos) < CONFIG.snapDistance) {
                this.snap();
            }
        }
    }

    snap() {
        this.isSnapped = true;
        this.mesh.position.copy(this.targetPos);
        this.mesh.rotation.set(0, 0, 0);
        this.material.color.setHex(CONFIG.colors.success);
        this.material.emissive.setHex(0x00ff00);
        this.material.wireframe = true; // Switch to wireframe for "installed" look
        checkWin();
    }
}

// --- 创建汽车部件（抽象）---
// 底盘
const chassisGeo = new THREE.BoxGeometry(4, 1, 6);
state.pieces.push(new CarPart(1, chassisGeo, new THREE.Vector3(0, 0, 0), new THREE.Vector3(-5, -2, 5)));

// 车轮 1
const wheelGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
wheelGeo.rotateZ(Math.PI / 2);
state.pieces.push(new CarPart(2, wheelGeo, new THREE.Vector3(2.5, -0.5, 2), new THREE.Vector3(-2, -2, 6)));

// 车轮 2
state.pieces.push(new CarPart(3, wheelGeo, new THREE.Vector3(-2.5, -0.5, 2), new THREE.Vector3(0, -2, 6)));

// 车轮 3
state.pieces.push(new CarPart(4, wheelGeo, new THREE.Vector3(2.5, -0.5, -2), new THREE.Vector3(2, -2, 6)));

// 车轮 4
state.pieces.push(new CarPart(5, wheelGeo, new THREE.Vector3(-2.5, -0.5, -2), new THREE.Vector3(5, -2, 6)));

// 发动机块
const engineGeo = new THREE.BoxGeometry(2, 1.5, 2);
state.pieces.push(new CarPart(6, engineGeo, new THREE.Vector3(0, 1.25, 2), new THREE.Vector3(0, -2, 8)));


function checkWin() {
    if (state.pieces.every(p => p.isSnapped)) {
        document.querySelector('#instructions h1').innerText = "Assembly Complete";
        document.querySelector('#instructions p').innerText = "System Online.";
    }
}

// --- MediaPipe ---
const videoElement = document.getElementById('input-video');
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

function onResults(results) {
    document.getElementById('loading').style.display = 'none';

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const wrist = landmarks[0];
        const middleFinger = landmarks[12];

        // 位置映射
        // 将归一化的 [0,1] 映射到场景坐标
        // 我们希望手部覆盖相机前方的合理区域
        // 相机位于 Z=12。平面位于 Z=0。
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * CONFIG.cameraZ;
        const width = height * camera.aspect;

        const x = (1 - indexTip.x - 0.5) * width;
        const y = (1 - indexTip.y - 0.5) * height;

        state.handPosition.set(x, y, 0);
        cursor.position.copy(state.handPosition);

        // 旋转计算
        // 基于手腕 -> 中指向量计算基本方向
        const handDir = new THREE.Vector3(
            (1 - middleFinger.x) - (1 - wrist.x),
            (1 - middleFinger.y) - (1 - wrist.y),
            (middleFinger.z - wrist.z) // Z 是相对深度
        ).normalize();

        // 创建一个朝向该方向的四元数
        const targetQuaternion = new THREE.Quaternion();
        const m = new THREE.Matrix4();
        // 假设 "向上" 大致是 Y，朝向 handDir
        const up = new THREE.Vector3(0, 1, 0);
        m.lookAt(new THREE.Vector3(0, 0, 0), handDir, up);
        targetQuaternion.setFromRotationMatrix(m);
        state.handRotation.copy(targetQuaternion);

        // 捏合检测
        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const wasPinching = state.isPinching;
        state.isPinching = distance < CONFIG.pinchThreshold;

        if (wasPinching && !state.isPinching) {
            if (state.grabbedPiece) state.grabbedPiece.release();
        }

        // 光标视觉效果
        cursor.material.color.setHex(state.isPinching ? 0xff0000 : 0xffffff);
    }
}

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 1280,
    height: 720
});
cameraUtils.start();

function animate() {
    requestAnimationFrame(animate);
    state.pieces.forEach(p => p.update());
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
