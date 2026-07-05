// --- 1. SPA ROUTING & STATE ---
let currentMode = 'encrypt';
let activeAgent = 'Vikram'; 
let isAnimating = true;

window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
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
    
    document.getElementById('agent-menu').classList.remove('show');
    document.querySelector('.has-submenu').classList.remove('open');
    
    appendMessage('system', `Protocol shifted. You are now working with ${agentName}.`);
}

document.addEventListener('click', () => {
    document.getElementById('agent-menu').classList.remove('show');
    document.querySelector('.has-submenu')?.classList.remove('open');
});

// --- 3. FRIEND/AGENT CRYPTO LOGIC ---
const agents = {
    'Vikram': {
        encrypt: (text) => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 4)).join(''),
        decrypt: (text) => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 4)).join('')
    },
    'Darpan': {
        encrypt: (text) => text.split('').reverse().map(c => String.fromCharCode(c.charCodeAt(0) + 5)).join(''),
        decrypt: (text) => text.split('').reverse().map(c => String.fromCharCode(c.charCodeAt(0) - 5)).join('')
    },
    'Suvro': {
        encrypt: (text) => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 75)).join(''),
        decrypt: (text) => text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 75)).join('')
    }
};

window.processMessage = function() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = '';

    setTimeout(() => {
        let result = currentMode === 'encrypt' 
            ? agents[activeAgent].encrypt(text) 
            : agents[activeAgent].decrypt(text);
            
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

// --- 4. THREE.JS CREASE-FREE COBALT WATER BACKGROUND ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x00112b, 0.009); // matches the trough colour, softer falloff so the gradient reads

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 45); 
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting setup — tuned down from the previous 2.5 / 3.5 intensities, which were
// bright enough to blow the surface out toward flat white. This keeps it premium
// and glossy while letting the blue gradient below actually show through.
const ambientLight = new THREE.AmbientLight(0x1c3b63, 0.6); // soft cobalt fill
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xbfe9ff, 1.3); // icy key light
dirLight.position.set(-30, 40, -10);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0x7dd3fc, 1.6, 160); // sky-blue sparkle on the crests
pointLight.position.set(15, 18, 25);
scene.add(pointLight);

const geometry = new THREE.PlaneGeometry(250, 250, 150, 150); 
geometry.rotateX(-Math.PI / 2);

// Per-vertex colour buffer — lets the wave carry an actual blue gradient instead
// of one flat cobalt tone, so the crests and troughs read as distinct depths.
const vertexCount = geometry.attributes.position.count;
const colorArray = new Float32Array(vertexCount * 3);
geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,          // white lets the vertex colours drive the hue untinted
    vertexColors: true,
    metalness: 0.5,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    transparent: true,
    opacity: 0.94,
    wireframe: false
});

const waterPlane = new THREE.Mesh(geometry, material);
waterPlane.position.y = -6;
scene.add(waterPlane);

// Premium blue gradient, deep trough to icy sunlit crest — pulled straight from
// the app's own brand blues (cobalt #002e73, ocean #0284c7, sky #38bdf8, ice #bae6fd)
// so the landing animation and the workspace UI feel like one palette.
const gradientStops = [
    { t: 0.00, color: new THREE.Color(0x00112b) }, // near-black deep navy trough
    { t: 0.28, color: new THREE.Color(0x002e73) }, // deep cobalt
    { t: 0.55, color: new THREE.Color(0x0284c7) }, // brand ocean blue
    { t: 0.80, color: new THREE.Color(0x38bdf8) }, // bright sky blue
    { t: 1.00, color: new THREE.Color(0xd8f3ff) }  // pale icy foam highlight
];

function smootherStep(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

const _tmpColor = new THREE.Color();
function getWaveColor(t, target) {
    t = Math.min(Math.max(t, 0), 1);
    for (let i = 0; i < gradientStops.length - 1; i++) {
        const a = gradientStops[i], b = gradientStops[i + 1];
        if (t >= a.t && t <= b.t) {
            const localT = smootherStep((t - a.t) / (b.t - a.t));
            return target.copy(a.color).lerp(b.color, localT);
        }
    }
    return target.copy(gradientStops[gradientStops.length - 1].color);
}

let time = 0;
const clock = new THREE.Clock();

function animate() {
    if (!isAnimating) return; 

    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    time += delta * 1.2; 

    const positions = waterPlane.geometry.attributes.position;
    const colors = waterPlane.geometry.attributes.color;

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Mathematical Wave Interference (Replaces the blocky FBM noise)
        // By overlapping multiple smooth sine/cosine waves traveling in different directions,
        // we create a perfectly smooth, crease-free rolling liquid surface.
        let height = 0;
        
        // Large rolling primary swells
        height += Math.sin((x * 0.02) + (z * 0.015) + time * 0.8) * 3.5;
        height += Math.cos((x * 0.015) - (z * 0.02) + time * 0.6) * 2.5;
        
        // Medium secondary cross-currents
        height += Math.sin((x * 0.04) + (z * 0.03) - time * 1.1) * 1.2;
        
        // Fine surface ripples to catch the specular highlights
        height += Math.cos((x * 0.08) - (z * 0.08) + time * 1.5) * 0.4;

        positions.setY(i, height);

        // Paint the depth gradient: crests brighten toward icy sky blue, troughs sink to navy
        const t = (height + 8) / 16; // amplitude sum is ~7.6, so ±8 covers the full range
        getWaveColor(t, _tmpColor);
        colors.setXYZ(i, _tmpColor.r, _tmpColor.g, _tmpColor.b);
    }

    waterPlane.geometry.computeVertexNormals();
    positions.needsUpdate = true;
    colors.needsUpdate = true;

    // Cinematic drifting camera
    camera.position.x = Math.sin(time * 0.15) * 6;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});