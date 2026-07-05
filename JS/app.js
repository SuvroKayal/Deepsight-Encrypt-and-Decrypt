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
            
        // Pass both display text and raw text for copying
        appendMessage('system', `[${activeAgent}] ${result}`, result);
    }, 400); 
}

function appendMessage(sender, displayHtml, rawTextToCopy = null) {
    const chatWindow = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    
    let bubbleContent = `<span>${displayHtml}</span>`;
    
    // Add Copy Button strictly for system outputs that contain data
    if (sender === 'system' && rawTextToCopy !== null) {
        // Escape quotes securely for the data attribute
        const safeText = rawTextToCopy.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        bubbleContent += `
        <button class="copy-bubble-btn" data-text="${safeText}" onclick="copyText(this)" title="Copy text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>`;
    }
    
    msgDiv.innerHTML = `<div class="bubble">${bubbleContent}</div>`;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Universal Copy function
window.copyText = function(btn) {
    const textToCopy = btn.getAttribute('data-text');
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        // Visual success indicator (green checkmark)
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => btn.innerHTML = originalHTML, 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
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
scene.fog = new THREE.FogExp2(0x000b18, 0.012); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 45); 
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x001833, 2.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xaee6ff, 3.5); 
dirLight.position.set(-30, 40, -10);
scene.add(dirLight);

const geometry = new THREE.PlaneGeometry(250, 250, 150, 150); 
geometry.rotateX(-Math.PI / 2);

const material = new THREE.MeshPhysicalMaterial({
    color: 0x002e73,          
    metalness: 0.9,           
    roughness: 0.15,          
    clearcoat: 1.0,           
    clearcoatRoughness: 0.1,  
    transparent: true,
    opacity: 0.9,
    wireframe: false
});

const waterPlane = new THREE.Mesh(geometry, material);
waterPlane.position.y = -6;
scene.add(waterPlane);

let time = 0;
const clock = new THREE.Clock();

function animate() {
    if (!isAnimating) return; 

    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    time += delta * 1.2; 

    const positions = waterPlane.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Mathematical Wave Interference for perfectly smooth rolling liquid
        let height = 0;
        height += Math.sin((x * 0.02) + (z * 0.015) + time * 0.8) * 3.5;
        height += Math.cos((x * 0.015) - (z * 0.02) + time * 0.6) * 2.5;
        height += Math.sin((x * 0.04) + (z * 0.03) - time * 1.1) * 1.2;
        height += Math.cos((x * 0.08) - (z * 0.08) + time * 1.5) * 0.4;

        positions.setY(i, height);
    }

    waterPlane.geometry.computeVertexNormals();
    positions.needsUpdate = true;

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