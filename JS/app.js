// --- 1. JS CRYPTO LOGIC ---
let mode = 'encrypt';
let lastResult = "";

function m0e(s){let r='';for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);r+=String.fromCharCode(i%2===0?c+4:c-2);}return r;}
function m0d(s){let r='';for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);r+=String.fromCharCode(i%2===0?c-4:c+2);}return r;}
function m1e(s){let r='',k=75;for(let i=0;i<s.length;i++)r+=String.fromCharCode(s.charCodeAt(i)^k);return r;}
function m2e(s){return s.split('').map(c=>String.fromCharCode(c.charCodeAt(0)+5)).reverse().join('');}
function m2d(s){return s.split('').reverse().map(c=>String.fromCharCode(c.charCodeAt(0)-5)).join('');}

function processCipher(input) {
  const algo = parseInt(document.getElementById('algo-sel').value);
  const fns = [[m0e, m0d], [m1e, m1e], [m2e, m2d]];
  return mode === 'encrypt' ? fns[algo][0](input) : fns[algo][1](input);
}

// --- 2. THREE.JS 3D SCENE (DNA Structure) ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Shared material for the theme switching
const material = new THREE.MeshStandardMaterial({
  color: 0xFF9933, // Initial color: Neon Saffron
  emissive: 0xFF9933,
  emissiveIntensity: 0.5,
  wireframe: true,
  transparent: true,
  opacity: 0.7
});

// Constructing the DNA Double Helix
const artifact = new THREE.Group(); 
const numBasePairs = 35;
const radius = 1.8;
const height = 12;
const heightStep = height / numBasePairs;
const angleStep = Math.PI * 0.15; // Controls the twist tightness

const nodeGeom = new THREE.IcosahedronGeometry(0.2, 0); // Tech-looking geometric nodes
const bridgeGeom = new THREE.CylinderGeometry(0.02, 0.02, radius * 2, 4);

for (let i = 0; i < numBasePairs; i++) {
    const y = (i - numBasePairs / 2) * heightStep;
    const angle = i * angleStep;

    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;

    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;

    // Strand 1 Node
    const node1 = new THREE.Mesh(nodeGeom, material);
    node1.position.set(x1, y, z1);
    artifact.add(node1);

    // Strand 2 Node
    const node2 = new THREE.Mesh(nodeGeom, material);
    node2.position.set(x2, y, z2);
    artifact.add(node2);

    // Bridge Connecting the Strands
    const bridge = new THREE.Mesh(bridgeGeom, material);
    bridge.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    bridge.lookAt(node1.position);
    bridge.rotateX(Math.PI / 2);
    artifact.add(bridge);
}

artifact.position.set(0, 0, 0); 
scene.add(artifact);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

camera.position.z = 9.5; // Adjusted to fit the taller DNA structure

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  // Slow, continuous spin for the DNA
  artifact.rotation.y -= 0.005; 
  // Gentle floating motion
  artifact.position.y = Math.sin(time) * 0.3; 
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Typing reaction: pulses the DNA and accelerates the spin slightly
document.getElementById('inp-ta').addEventListener('input', () => {
  gsap.to(artifact.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.1, yoyo: true, repeat: 1 });
  artifact.rotation.y -= 0.04;
});

// --- 3. UI LOGIC & PAGE TRANSITIONS ---
window.switchTheme = function(newMode) {
  mode = newMode;
  document.body.setAttribute('data-theme', mode);
  
  document.getElementById('btn-enc').classList.toggle('active', mode === 'encrypt');
  document.getElementById('btn-dec').classList.toggle('active', mode === 'decrypt');

  document.getElementById('desc-title').innerText = mode === 'encrypt' ? 'Deepsight Encrypt' : 'Deepsight Decrypt';
  
  // Transition colors: Saffron (#FF9933) for Encrypt, Chakra Neon Blue (#0066FF) for Decrypt
  const targetColor = mode === 'encrypt' ? new THREE.Color(0xFF9933) : new THREE.Color(0x0066FF);
  
  gsap.to(material.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 1 });
  gsap.to(material.emissive, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 1 });
};

const SCRAMBLE_CHARS = '01#@$%&*<>ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function scrambleText(finalText, element) {
  const duration = 1200; 
  const startTime = Date.now();
  
  function update() {
    const now = Date.now();
    const progress = (now - startTime) / duration;
    
    if (progress >= 1) {
      element.textContent = finalText;
      return;
    }

    const revealCount = Math.floor(progress * finalText.length);
    let scrambled = '';
    
    for(let i = 0; i < finalText.length; i++) {
      if (i < revealCount) {
        scrambled += finalText[i]; 
      } else {
        if(finalText[i] === ' ' || finalText[i] === '\n') {
          scrambled += finalText[i];
        } else {
          scrambled += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]; 
        }
      }
    }
    
    element.textContent = scrambled;
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.executeProcess = function() {
  const input = document.getElementById('inp-ta').value;
  if (!input) return;

  const stageInput = document.getElementById('stage-input');
  const stageOutput = document.getElementById('stage-output');
  const outText = document.getElementById('out-text');
  const badge = document.getElementById('status-badge');
  
  // Dramatic camera zoom and aggressive rotation on execution
  gsap.to(camera.position, { z: 6.5, duration: 0.8, yoyo: true, repeat: 1, ease: "power2.inOut" });
  gsap.to(artifact.rotation, { y: "-=3", duration: 1.5, ease: "power2.inOut" });

  stageInput.style.opacity = '0';
  
  setTimeout(() => {
    stageInput.classList.remove('active');
    stageOutput.classList.add('active');
    
    setTimeout(() => {
      stageOutput.style.opacity = '1';
      
      badge.textContent = mode === 'encrypt' ? 'ENCRYPTED' : 'DECRYPTED';
      try {
        lastResult = processCipher(input);
        scrambleText(lastResult, outText);
      } catch (err) {
        outText.textContent = "SYS_ERROR: " + err.message;
      }
    }, 50);
  }, 500);
};

window.resetProcess = function() {
  const stageInput = document.getElementById('stage-input');
  const stageOutput = document.getElementById('stage-output');
  
  stageOutput.style.opacity = '0';
  
  setTimeout(() => {
    stageOutput.classList.remove('active');
    stageInput.classList.add('active');
    
    document.getElementById('inp-ta').value = '';
    
    setTimeout(() => {
      stageInput.style.opacity = '1';
    }, 50);
  }, 500);
};

window.copyToClipboard = function() {
  if (!lastResult) return;
  
  navigator.clipboard.writeText(lastResult).then(() => {
    const copyBtn = document.getElementById('copy-btn');
    const originalHTML = copyBtn.innerHTML;
    
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
    copyBtn.style.backgroundColor = 'var(--accent)';
    copyBtn.style.color = '#fff';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.style.backgroundColor = 'transparent';
      copyBtn.style.color = 'var(--accent)';
    }, 2000);
  });
};

gsap.to(document.getElementById('stage-input'), {opacity: 1, duration: 1, delay: 0.2});