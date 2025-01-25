import * as THREE from 'three';

// Configuration
const CONFIG = {
  NUM_SPHERES: 20,
  BASE_GROWTH_RATE: 0.5,
  WORLD_RADIUS: 15,
  SPAWN_INTERVAL: 500, // Milliseconds between spawns
  INITIAL_RADIUS: 1.0,
  CAMERA_DISTANCE: 30
};

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Debug Info
const debugInfo = document.createElement('div');
debugInfo.style.position = 'fixed';
debugInfo.style.top = '10px';
debugInfo.style.left = '10px';
debugInfo.style.color = 'white';
document.body.appendChild(debugInfo);

class GrowingSphere {
    constructor() {
        console.log('Creating new sphere...');
        
        // Create visible sphere immediately
        this.geometry = new THREE.SphereGeometry(CONFIG.INITIAL_RADIUS, 32, 32);
        this.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
            wireframe: true // Start with wireframe for visibility
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Set random position
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * CONFIG.WORLD_RADIUS * 1.5,
            (Math.random() - 0.5) * CONFIG.WORLD_RADIUS * 1.5,
            (Math.random() - 0.5) * CONFIG.WORLD_RADIUS * 1.5
        );
        this.mesh.position.copy(position);
        
        scene.add(this.mesh);
        console.log('Sphere added at:', position);
    }

    update() {
        // Simple growth without constraints for testing
        this.mesh.scale.x += 0.01;
        this.mesh.scale.y += 0.01;
        this.mesh.scale.z += 0.01;
    }
}

// Camera setup
camera.position.z = CONFIG.CAMERA_DISTANCE;
camera.lookAt(0, 0, 0);

// Spawn initial spheres
const spheres = [];
for (let i = 0; i < CONFIG.NUM_SPHERES; i++) {
    spheres.push(new GrowingSphere());
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update debug info
    debugInfo.textContent = `Spheres: ${spheres.length}\nCamera Position: ${camera.position.z.toFixed(1)}`;
    
    // Update all spheres
    spheres.forEach(sphere => sphere.update());
    renderer.render(scene, camera);
}

// Start animation
animate();

// Debug controls
window.addEventListener('keydown', (e) => {
    if (e.key === '+') camera.position.z *= 0.9;
    if (e.key === '-') camera.position.z *= 1.1;
});

console.log('Simulation started! Check your browser console for spawn logs.');
