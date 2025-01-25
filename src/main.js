import * as THREE from 'three';

const config = {
    WORLD_SIZE: 800,
    MIN_RADIUS: 10,
    MAX_RADIUS: 80,
    EXPANSION_RATE: 1.2,
    INITIAL_SPAWN_DELAY: 1000,
    SPAWN_GROWTH_FACTOR: 0.15,
    MAX_SPHERES: 50,
    SPAWN_ATTEMPTS: 100
};

class SphereSimulation {
    constructor() {
        this.spheres = [];
        this.occupied = new Set();
        this.spawnTimer = 0;
        this.spawnRate = 1;
        this.frameCount = 0;
        this.speedMultiplier = 1;
        this.cameraAngle = 0;
        this.autoRotate = false;

        // Three.js setup
        this.initThree();
        this.setupControls();
        this.createSphere();
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 5000);
        this.camera.position.z = config.WORLD_SIZE * 0.7;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(300, 300, 300);
        this.scene.add(directional);
    }

    setupControls() {
        this.debugInfo = document.createElement('div');
        this.debugInfo.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            font-family: monospace;
            border-radius: 5px;
        `;
        document.body.appendChild(this.debugInfo);
    }

    // ... (Keep all the methods from previous implementation) ...

    animate(timestamp) {
        requestAnimationFrame((t) => this.animate(t));
        const deltaTime = ((timestamp - this.lastUpdate) / 1000 || 0) * this.speedMultiplier;
        this.lastUpdate = timestamp;
        this.frameCount++;

        // Auto-rotate camera
        if(this.autoRotate) {
            this.cameraAngle += deltaTime * 0.2;
            this.camera.position.x = Math.sin(this.cameraAngle) * config.WORLD_SIZE * 0.7;
            this.camera.position.z = Math.cos(this.cameraAngle) * config.WORLD_SIZE * 0.7;
            this.camera.lookAt(0, 0, 0);
        }

        this.updateSpheres(deltaTime);
        this.updateSpawnRate(deltaTime);

        if (this.frameCount % 10 === 0) {
            this.debugInfo.innerHTML = `
                Active Spheres: ${this.spheres.length}<br>
                Current Speed: ${this.speedMultiplier.toFixed(1)}x<br>
                World Radius: ${config.WORLD_SIZE/2}<br>
                Next Sphere In: ${(config.INITIAL_SPAWN_DELAY * 
                    Math.exp(-config.SPAWN_GROWTH_FACTOR * this.spheres.length)).toFixed(0)}ms
            `;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Global functions for UI controls
const sim = new SphereSimulation();

window.setCameraView = (direction) => {
    const distance = config.WORLD_SIZE * 0.7;
    switch(direction) {
        case 'front':
            sim.camera.position.set(0, 0, distance);
            sim.autoRotate = false;
            break;
        case 'top':
            sim.camera.position.set(0, distance, 0);
            sim.camera.lookAt(0, 0, 0);
            sim.autoRotate = false;
            break;
        case 'side':
            sim.camera.position.set(distance, 0, 0);
            sim.autoRotate = false;
            break;
        case 'orbit':
            sim.autoRotate = true;
            break;
    }
    sim.camera.lookAt(0, 0, 0);
};

window.updateSpeed = (value) => {
    sim.speedMultiplier = parseFloat(value);
    document.getElementById('speedValue').textContent = `${value}x`;
};

window.resetSimulation = () => {
    sim.spheres.forEach(sphere => sim.scene.remove(sphere.mesh));
    sim.spheres = [];
    sim.occupied = new Set();
    sim.spawnTimer = 0;
    sim.spawnRate = 1;
    sim.frameCount = 0;
    sim.camera.position.set(0, 0, config.WORLD_SIZE * 0.7);
    sim.camera.lookAt(0, 0, 0);
    sim.createSphere();
};

// Start animation
sim.animate(performance.now());

// Event listeners
window.addEventListener('resize', () => {
    sim.camera.aspect = window.innerWidth / window.innerHeight;
    sim.camera.updateProjectionMatrix();
    sim.renderer.setSize(window.innerWidth, window.innerHeight);
});
