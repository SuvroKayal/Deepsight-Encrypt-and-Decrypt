// --- 1. SPA ROUTING & STATE ---
let currentMode = 'encrypt';
let activeAgent = 'Sahaya';
let isAnimating = true;

window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Stop the 3D animation to save resources on the clean app page
    if(pageId === 'app') {
        isAnimating = false;
    } else {
        isAnimating = true;
        animate(); 
    }
}

window.setMode = function(mode) {
    currentMode = mode;
    document.getElementById('btn-enc').classList.toggle('active', mode === 'encrypt');
    document.getElementById('btn-dec').classList.toggle('active', mode === 'decrypt');
}

// --- 2. THE "+" MENU LOGIC ---
window.toggleMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('agent-menu');
    menu.classList.toggle('show');
    
    if(!menu.classList.contains('show')) {
        document.querySelector('.has-submenu').classList.remove('open');
    }
}

window.toggleSubmenu = function(e) {
    e.stopPropagation();
    e.currentTarget.classList.toggle('open');
}

window.selectAgent = function(agentName) {
    activeAgent = agentName;
    
    // Close menus
    document.getElementById('agent-menu').classList.remove('show');
    document.querySelector('.has-submenu').classList.remove('open');
    
    appendMessage('system', `Switched protocol to Friend: ${agentName}.`);
}

document.addEventListener('click', () => {
    document.getElementById('agent-menu').classList.remove('show');
    document.querySelector('.has-submenu')?.classList.remove('open');
});

// --- 3. CHAT LOGIC ---
function encrypt(text) { return text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join(''); }
function decrypt(text) { return text.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join(''); }

window.processMessage = function() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = '';

    setTimeout(() => {
        let result = currentMode === 'encrypt' ? encrypt(text) : decrypt(text);
        appendMessage('system', `[${activeAgent}] ${result}`);
    }, 400); 
}

function appendMessage(sender, text) {
    const chatWindow = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processMessage();
    }
});

// --- 4. THREE.JS PAINTERLY SUNSET WAVE BACKGROUND ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a0a1f, 0.012); // warm dusk haze instead of cold navy

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Cinematic Sunset Lighting (Coral / Magenta / Gold Palette)
const ambientLight = new THREE.AmbientLight(0xff9d6b, 0.55); // warm peach base fill
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x8e3b6f, 1.1); // deep magenta/purple shadow caster
dirLight.position.set(-20, 20, 10);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffd27a, 1.9, 120); // warm gold highlight for the crests
pointLight.position.set(20, 10, 20);
scene.add(pointLight);

// Creating the Water Plane — a bit higher-res so the noise-driven surface reads smoothly
const geometry = new THREE.PlaneGeometry(200, 200, 120, 120);
geometry.rotateX(-Math.PI / 2);

// Per-vertex colour buffer so the wave can carry a painterly, multi-hued gradient
const vertexCount = geometry.attributes.position.count;
const colorArray = new Float32Array(vertexCount * 3);
geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

// Matte-ish "oil paint" material — vertex colours do the work, not reflections
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.12,
    vertexColors: true,
    wireframe: false
});

const waterPlane = new THREE.Mesh(geometry, material);
waterPlane.position.y = -5;
scene.add(waterPlane);

// --- Lightweight 2D value-noise (no external deps) ---
// Gives organic, non-repeating motion instead of a mechanical sine grid —
// the same building block behind most "painterly fluid" look-dev tricks.
const _noisePerm = new Uint8Array(512);
(function seedNoise(seed) {
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) _noisePerm[i] = p[i & 255];
})(1337);

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
}
function noise2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = _noisePerm[X + _noisePerm[Y]];
    const ab = _noisePerm[X + _noisePerm[Y + 1]];
    const ba = _noisePerm[X + 1 + _noisePerm[Y]];
    const bb = _noisePerm[X + 1 + _noisePerm[Y + 1]];
    const x1 = lerp(grad(aa, x, y), grad(ba, x - 1, y), u);
    const x2 = lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u);
    return lerp(x1, x2, v); // ~ -1..1
}
// Fractal Brownian Motion: layers a few noise octaves for richer, brushstroke-like detail
function fbm(x, y, octaves) {
    let total = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
        total += noise2D(x * freq, y * freq) * amp;
        maxAmp += amp;
        amp *= 0.5;
        freq *= 2;
    }
    return total / maxAmp; // normalized ~ -1..1
}
function smootherStep(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

// Sunset gradient stops, from deep trough to sunlit foam crest (mirrors the reference painting)
const gradientStops = [
    { t: 0.00, color: new THREE.Color(0x0e4d5c) }, // deep teal trough
    { t: 0.30, color: new THREE.Color(0x5b2c6f) }, // violet
    { t: 0.52, color: new THREE.Color(0xc4348c) }, // magenta / pink
    { t: 0.75, color: new THREE.Color(0xff7a30) }, // sunset orange
    { t: 1.00, color: new THREE.Color(0xffe9a8) }  // pale gold foam
];

const _tmpColor = new THREE.Color();
function getWaveColor(t, target) {
    t = Math.min(Math.max(t, 0), 1);
    for (let i = 0; i < gradientStops.length - 1; i++) {
        const a = gradientStops[i], b = gradientStops[i + 1];
        if (t >= a.t && t <= b.t) {
            // smootherstep instead of a linear lerp — softens the seams between colour bands
            const localT = smootherStep((t - a.t) / (b.t - a.t));
            return target.copy(a.color).lerp(b.color, localT);
        }
    }
    return target.copy(gradientStops[gradientStops.length - 1].color);
}

let time = 0;
const clock = new THREE.Clock();

function animate() {
    if (!isAnimating) return; // Pauses on App page

    requestAnimationFrame(animate);
    // Delta-time driven, so motion speed stays identical whether the display
    // runs at 30fps, 60fps or 120fps — this alone removes most of the "jitter" feel.
    const delta = Math.min(clock.getDelta(), 0.05);
    time += delta * 0.9;

    const positions = waterPlane.geometry.attributes.position;
    const colors = waterPlane.geometry.attributes.color;

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Domain warp: distort the sampling coordinates with their own slow-moving noise
        // field before reading the main wave. This is what turns a flat grid ripple into
        // the swirling, hand-painted current in the reference art.
        const warpX = fbm((x + time * 6) * 0.01, (z - time * 4) * 0.01, 2) * 8;
        const warpZ = fbm((z - time * 5) * 0.01, (x + time * 3) * 0.01, 2) * 8;

        // Large rolling swells (fbm) + a fine ripple layer for brush-like surface texture
        const swell = fbm((x + warpX) * 0.022 + time * 0.15, (z + warpZ) * 0.022 - time * 0.1, 4) * 5.5;
        const ripple = Math.sin((x + z) * 0.15 + time * 1.4) * 0.35;
        const height = swell + ripple;

        positions.setY(i, height);

        // Paint the crest/trough gradient: peaks glow gold/orange, troughs sink into teal/violet
        const t = (height + 5) / 10;
        getWaveColor(t, _tmpColor);
        colors.setXYZ(i, _tmpColor.r, _tmpColor.g, _tmpColor.b);
    }

    // Crucial for lighting to reflect correctly off the moving waves
    waterPlane.geometry.computeVertexNormals();
    positions.needsUpdate = true;
    colors.needsUpdate = true;

    // Slow camera drift for extra aesthetic feel
    camera.position.x = Math.sin(time * 0.2) * 5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});