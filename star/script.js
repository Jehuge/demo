// 场景设置
const scene = new THREE.Scene();
// 默认深紫背景，在图片加载前显示
scene.background = new THREE.Color(0x1a0b2e);
// 调整雾气颜色为深紫色，与星云背景融合，避免死黑
scene.fog = new THREE.FogExp2(0x1a0b2e, 0.002);

// 添加星星背景
const starGeometry = new THREE.BufferGeometry();
// 星星更亮更白，突出于彩色背景
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.0, transparent: true, opacity: 0.9 });
const starVertices = [];
for (let i = 0; i < 15000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// 关键：设置像素比，解决模糊问题
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// 加载色彩丰富的星云背景图 (使用 4K 高清版本解决模糊问题)
const bgTexture = textureLoader.load('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=90');

// 使用天空球 (Sky Sphere) 代替 scene.background，这样背景会随相机旋转
const skyGeometry = new THREE.SphereGeometry(4000, 64, 64); // 足够大的半径
const skyMaterial = new THREE.MeshBasicMaterial({ 
    map: bgTexture, 
    side: THREE.BackSide, // 渲染球体内侧
    fog: false // 背景不受雾气影响，保持清晰
});
const skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skyBox);

// 使用 github raw content 加载纹理
const texPath = 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/';

// 获取最大各向异性过滤值，提升纹理清晰度
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// 光源
// 增加环境光亮度，避免阴影面太死黑
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
scene.add(ambientLight);

// 增加太阳光强度，照射范围更远
const pointLight = new THREE.PointLight(0xffffff, 1.0, 0, 0); 
scene.add(pointLight);

// 太阳
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunTexture = textureLoader.load(texPath + 'sunmap.jpg');
sunTexture.anisotropy = maxAnisotropy;
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// 行星数据
// 补充 J2000.0 天文参数，用于"真实位置"计算
// peri_long: 近日点经度 (Longitude of perihelion)
// M0: J2000 平近点角 (Mean anomaly)
// rate: 日运动率 (degrees/day)
const planetsData = [
    { 
        name: "Mercury", 
        distance: 12, 
        e: 0.2056, i: 7.00, 
        peri_long: 77.46, M0: 174.79, rate: 4.092,
        size: 1.5, speed: 4.1, rot_period: 58.65,
        map: 'mercurymap.jpg', bump: 'mercurybump.jpg'
    },
    { 
        name: "Venus", 
        distance: 18, 
        e: 0.0068, i: 3.39, 
        peri_long: 131.53, M0: 50.41, rate: 1.602,
        size: 2.5, speed: 1.6, rot_period: -243.0,
        map: 'venusmap.jpg', bump: 'venusbump.jpg'
    },
    { 
        name: "Earth", 
        distance: 26, 
        e: 0.0167, i: 0.00, 
        peri_long: 102.94, M0: 357.53, rate: 0.9856,
        size: 2.6, speed: 1.0, rot_period: 1.0,
        map: 'earthmap1k.jpg', bump: 'earthbump1k.jpg', spec: 'earthspec1k.jpg'
    },
    { 
        name: "Mars", 
        distance: 34, 
        e: 0.0934, i: 1.85, 
        peri_long: 336.04, M0: 19.41, rate: 0.524,
        size: 2.0, speed: 0.53, rot_period: 1.03,
        map: 'marsmap1k.jpg', bump: 'marsbump1k.jpg'
    },
    { 
        name: "Jupiter", 
        distance: 48, 
        e: 0.0484, i: 1.30, 
        peri_long: 14.75, M0: 20.02, rate: 0.083,
        size: 7.0, speed: 0.084, rot_period: 0.41,
        map: 'jupitermap.jpg'
    },
    { 
        name: "Saturn", 
        distance: 64, 
        e: 0.0541, i: 2.49, 
        peri_long: 92.43, M0: 317.02, rate: 0.033,
        size: 6.0, speed: 0.034, rot_period: 0.45,
        map: 'saturnmap.jpg',
        hasRing: true, ringMap: 'saturnringcolor.jpg', ringAlpha: 'saturnringpattern.gif'
    },
    { 
        name: "Uranus", 
        distance: 80, 
        e: 0.0472, i: 0.77, 
        peri_long: 170.96, M0: 142.59, rate: 0.011,
        size: 4.5, speed: 0.012, rot_period: -0.72,
        map: 'uranusmap.jpg',
        hasRing: true, ringMap: 'uranusringcolour.jpg', ringAlpha: 'uranusringtrans.gif'
    },
    { 
        name: "Neptune", 
        distance: 96, 
        e: 0.0086, i: 1.77, 
        peri_long: 44.97, M0: 256.22, rate: 0.006,
        size: 4.4, speed: 0.006, rot_period: 0.67,
        map: 'neptunemap.jpg'
    }
];

const planets = [];

// 辅助函数：将角度转换为弧度
function degToRad(deg) {
    return deg * (Math.PI / 180);
}

// 计算椭圆轨道上的点
// 增加 peri_long (近日点经度) 参数，用于旋转轨道
function getOrbitPoints(distance, e, i_deg, peri_long = 0) {
    const points = [];
    const i_rad = degToRad(i_deg);
    const peri_rad = degToRad(peri_long);
    const segments = 128;
    
    // 这里的 distance 已经是视觉上的半长轴 a
    
    for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        // 极坐标方程 (theta 是真近点角)
        const r = (distance * (1 - e * e)) / (1 + e * Math.cos(theta));
        
        // 轨道平面坐标
        let x = r * Math.cos(theta);
        let z = r * Math.sin(theta);

        // 应用近日点旋转 (绕 Y 轴)
        // x_new = x * cos(p) - z * sin(p)
        // z_new = x * sin(p) + z * cos(p)
        const x_rot = x * Math.cos(peri_rad) - z * Math.sin(peri_rad);
        const z_rot = x * Math.sin(peri_rad) + z * Math.cos(peri_rad);
        
        x = x_rot;
        z = z_rot;
        
        // 绕 X 轴旋转 (倾角)
        // y_final = z * sin(i)
        // z_final = z * cos(i)
        const y_final = z * Math.sin(i_rad);
        const z_final = z * Math.cos(i_rad);
        
        points.push(new THREE.Vector3(x, y_final, z_final));
    }
    return points;
}

// 创建轨道线
function createOrbit(data) {
    const points = getOrbitPoints(data.distance, data.e, data.i, data.peri_long);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // 增强轨迹线可见度：更亮，不透明度更高
    const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa, opacity: 0.8, transparent: true });
    const orbit = new THREE.Line(geometry, material);
    scene.add(orbit);
}

// 创建行星
planetsData.forEach(data => {
    createOrbit(data);

    const geometry = new THREE.SphereGeometry(data.size, 64, 64);
    
    // 材质设置
    const mapTexture = textureLoader.load(texPath + data.map);
    mapTexture.anisotropy = maxAnisotropy; // 开启各向异性过滤

    const materialParams = {
        map: mapTexture,
    };
    
    if (data.bump) {
        const bumpTexture = textureLoader.load(texPath + data.bump);
        bumpTexture.anisotropy = maxAnisotropy;
        materialParams.bumpMap = bumpTexture;
        materialParams.bumpScale = 0.05;
    }
    
    if (data.spec) {
        const specTexture = textureLoader.load(texPath + data.spec);
        specTexture.anisotropy = maxAnisotropy;
        materialParams.specularMap = specTexture;
        materialParams.specular = new THREE.Color('grey');
    }

    const material = new THREE.MeshPhongMaterial(materialParams);
    const planet = new THREE.Mesh(geometry, material);
    
    // 创建一个组来容纳行星（及其卫星），这样可以分离公转（组移动）和自转（Mesh旋转）
    const planetGroup = new THREE.Group();
    planetGroup.add(planet);

    // 如果有光环
    if (data.hasRing) {
        // 创建环的几何体
        // 内径和外径根据行星大小调整
        const innerRadius = data.size * 1.4;
        const outerRadius = data.size * 2.2;
        
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        // 环的UV映射需要调整，因为RingGeometry默认是中心辐射状的UV
        const pos = ringGeometry.attributes.position;
        const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++){
            v3.fromBufferAttribute(pos, i);
            // 计算简单的圆环纹理映射
            ringGeometry.attributes.uv.setXY(i, v3.length() < (innerRadius + outerRadius)/2 ? 0 : 1, 1);
        }
        
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            map: data.ringMap ? textureLoader.load(texPath + data.ringMap) : null,
            alphaMap: data.ringAlpha ? textureLoader.load(texPath + data.ringAlpha) : null,
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.8 
        });
        
        // 如果没有纹理，使用之前的颜色兜底（虽然这里都有配置）
        if (!data.ringMap) {
            ringMaterial.color = new THREE.Color(0xaaaaaa);
        }

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    // 特殊处理：地球添加月球
    let moonObj = null;
    if (data.name === "Earth") {
        const moonGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const moonTexture = textureLoader.load(texPath + 'moonmap1k.jpg');
        const moonBump = textureLoader.load(texPath + 'moonbump1k.jpg');
        moonTexture.anisotropy = maxAnisotropy;
        moonBump.anisotropy = maxAnisotropy;
        
        const moonMaterial = new THREE.MeshPhongMaterial({
            map: moonTexture,
            bumpMap: moonBump,
            bumpScale: 0.02
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        planetGroup.add(moon);
        
        moonObj = {
            mesh: moon,
            angle: 0,
            distance: 6, // 距离地球的距离
            speed: 2.0   // 月球公转速度
        };
    }

    scene.add(planetGroup);

    planets.push({
        group: planetGroup, // 负责公转位置
        mesh: planet,       // 负责自转
        moon: moonObj,      // 月球数据
        data: data,
        angle: Math.random() * Math.PI * 2 // 初始真近点角
    });
});

camera.position.set(0, 60, 100);
controls.update();

// 交互控制
let speedMultiplier = 1;
let rotationMultiplier = 1; // 自转速度倍率
let planetSizeMultiplier = 1;
let isRealTimeMode = false;
let simulationDate = new Date();
let timeScale = 1; // 真实模式下，1秒对应多少天

// UI 元素获取
const simModeBtn = document.getElementById('simModeBtn');
const realModeBtn = document.getElementById('realModeBtn');
const simPanel = document.getElementById('simPanel');
const realPanel = document.getElementById('realPanel');
const currentDateEl = document.getElementById('currentDate');

// 模式切换
simModeBtn.addEventListener('click', () => {
    isRealTimeMode = false;
    simModeBtn.classList.add('active');
    realModeBtn.classList.remove('active');
    simPanel.classList.add('active');
    realPanel.classList.remove('active');
});

realModeBtn.addEventListener('click', () => {
    isRealTimeMode = true;
    simulationDate = new Date(); // 切换时重置为当前时间
    realModeBtn.classList.add('active');
    simModeBtn.classList.remove('active');
    realPanel.classList.add('active');
    simPanel.classList.remove('active');
    syncToDate(simulationDate);
});

// 1. 公转速度控制 (模拟模式)
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
speedRange.addEventListener('input', (e) => {
    speedMultiplier = parseFloat(e.target.value);
    speedValue.textContent = speedMultiplier + 'x';
});

// 1.1 自转速度控制 (模拟模式)
const rotationSpeedRange = document.getElementById('rotationSpeedRange');
const rotationSpeedValue = document.getElementById('rotationSpeedValue');
rotationSpeedRange.addEventListener('input', (e) => {
    rotationMultiplier = parseFloat(e.target.value);
    rotationSpeedValue.textContent = rotationMultiplier + 'x';
});

// 1.2 时间流逝控制 (真实模式)
const timeScaleRange = document.getElementById('timeScaleRange');
const timeScaleValue = document.getElementById('timeScaleValue');
timeScaleRange.addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    
    // 智能显示：小于1时显示几秒一天，大于等于1时显示几天一秒
    if (timeScale < 1.0) {
        // 例如 0.2 天/秒 -> 1/0.2 = 5 秒/天
        const secondsPerDay = Math.round(1 / timeScale * 10) / 10;
        timeScaleValue.textContent = secondsPerDay + '秒/天';
    } else {
        timeScaleValue.textContent = Math.round(timeScale * 10) / 10 + '天/秒';
    }
});

// 2. 太阳亮度控制
const sunIntensityRange = document.getElementById('sunIntensityRange');
const sunIntensityValue = document.getElementById('sunIntensityValue');
sunIntensityRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    pointLight.intensity = val;
    sunIntensityValue.textContent = val;
});

// 3. 环境光控制
const ambientIntensityRange = document.getElementById('ambientIntensityRange');
const ambientIntensityValue = document.getElementById('ambientIntensityValue');
ambientIntensityRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    ambientLight.intensity = val;
    ambientIntensityValue.textContent = val;
});

// 4. 星体大小控制
const planetSizeRange = document.getElementById('planetSizeRange');
const planetSizeValue = document.getElementById('planetSizeValue');
planetSizeRange.addEventListener('input', (e) => {
    planetSizeMultiplier = parseFloat(e.target.value);
    planetSizeValue.textContent = planetSizeMultiplier + 'x';
    
    // 更新所有行星的大小
    planets.forEach(p => {
        p.mesh.scale.set(planetSizeMultiplier, planetSizeMultiplier, planetSizeMultiplier);
        if (p.moon) {
             p.moon.mesh.scale.set(planetSizeMultiplier, planetSizeMultiplier, planetSizeMultiplier);
        }
    });
});

// 计算指定日期的天文位置
function syncToDate(date) {
    // 更新日期显示
    currentDateEl.textContent = date.toLocaleDateString();

    // J2000 起始时间 (2000-01-01 12:00 UTC)
    const j2000 = new Date('2000-01-01T12:00:00Z');
    // 计算天数差 d
    const d = (date - j2000) / (1000 * 60 * 60 * 24);

    planets.forEach(p => {
        if (!p.data.M0) return; // 只有有数据的才计算

        // 1. 计算平近点角 Mean Anomaly M
        let M = p.data.M0 + p.data.rate * d;
        // 标准化到 0-360
        M = M % 360;
        if (M < 0) M += 360;

        // 2. 解开普勒方程求解 偏近点角 Eccentric Anomaly E
        // M = E - e * sin(E) (需迭代求解)
        // 初始猜测 E = M (弧度)
        const e = p.data.e;
        let E = degToRad(M); 
        const M_rad = degToRad(M);
        
        // 简单的迭代求解
        for (let i = 0; i < 10; i++) {
            E = M_rad + e * Math.sin(E);
        }

        // 3. 计算真近点角 True Anomaly v
        // tan(v/2) = sqrt((1+e)/(1-e)) * tan(E/2)
        const v_half = Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2);
        let v = 2 * Math.atan(v_half);
        // v 现在是弧度
        
        // 修正负角度
        if (v < 0) v += Math.PI * 2;

        // 4. 将计算出的真近点角 v 赋值给我们的 angle
        p.angle = v;

        // 更新自转 (真实模式)
        // 角度 = (天数 / 自转周期) * 2PI
        p.mesh.rotation.y = (d / p.data.rot_period) * Math.PI * 2;

        // 更新月球位置 (简单近似)
        if (p.moon) {
            const moonPhase = (d % 27.32) / 27.32 * Math.PI * 2;
            p.moon.angle = moonPhase;
            // 月球潮汐锁定：自转角 = 公转角 + PI (修正面朝向)
            p.moon.mesh.rotation.y = moonPhase + Math.PI;
        }
    });
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    if (isRealTimeMode) {
        // 真实模式：时间流逝
        // 每帧增加的时间 = timeScale (天/秒) * 1/60 (秒/帧)
        const daysPerFrame = timeScale / 60;
        simulationDate.setTime(simulationDate.getTime() + daysPerFrame * 24 * 60 * 60 * 1000);
        syncToDate(simulationDate);
    } else {
        // 模拟模式：按固定速度旋转
        planets.forEach(p => {
            p.angle += p.data.speed * 0.005 * speedMultiplier; 
            p.angle = p.angle % (Math.PI * 2);
            
            // 模拟自转: 独立受 rotationMultiplier 控制
            // 地球(rot_period=1) 基准速度 0.02
            p.mesh.rotation.y += (0.02 / Math.abs(p.data.rot_period)) * rotationMultiplier;
            // 金星逆向自转 (rot_period 为负) 会自然处理

            // 模拟模式下也让月球动起来
            if (p.moon) {
                // 月球公转跟随行星公转速度(speedMultiplier)
                p.moon.angle += p.moon.speed * 0.01 * speedMultiplier;
                // 月球潮汐锁定
                p.moon.mesh.rotation.y = p.moon.angle + Math.PI;
            }
        });
    }

    planets.forEach(p => {
        // 更新位置 (根据 p.angle)
        const a = p.data.distance;
        const e = p.data.e;
        const i_rad = degToRad(p.data.i);
        const peri_rad = degToRad(p.data.peri_long || 0);
        
        // p.angle 在这里被视为 真近点角 (True Anomaly)
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(p.angle));
        
        // 轨道平面坐标
        let x = r * Math.cos(p.angle);
        let z = r * Math.sin(p.angle);

        // 应用近日点旋转 (绕 Y 轴)
        const x_rot = x * Math.cos(peri_rad) - z * Math.sin(peri_rad);
        const z_rot = x * Math.sin(peri_rad) + z * Math.cos(peri_rad);
        
        x = x_rot;
        z = z_rot;
        
        // 应用倾角 (绕 X 轴旋转)
        const y_final = z * Math.sin(i_rad);
        const z_final = z * Math.cos(i_rad);
        
        p.group.position.set(x, y_final, z_final);
        
        // 自转更新已在上方根据模式分别处理 (syncToDate 或 模拟循环中)

        // 3. 月球位置更新 (仅更新位置，角度已经在上面更新过了)
        if (p.moon) {
            const mx = Math.cos(p.moon.angle) * p.moon.distance;
            const mz = Math.sin(p.moon.angle) * p.moon.distance;
            // 稍微倾斜月球轨道
            const my = Math.sin(p.moon.angle) * (p.moon.distance * 0.2); 
            
            p.moon.mesh.position.set(mx, my, mz);
        }
    });

    sun.rotation.y += 0.002;

    controls.update();
    renderer.render(scene, camera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
