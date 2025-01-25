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
        console.log('Simulation initialized');
    }

    initThree() {
        // Scene with dark background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 5000);
        this.camera.position.set(0, 0, config.WORLD_SIZE * 0.7);
        this.camera.lookAt(0, 0, 0);
        
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

    getPositionHash(pos) {
        return `${Math.round(pos.x/5)*5},${Math.round(pos.y/5)*5},${Math.round(pos.z/5)*5}`;
    }

    findValidPosition() {
        for (let i = 0; i < config.SPAWN_ATTEMPTS; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * config.WORLD_SIZE,
                (Math.random() - 0.5) * config.WORLD_SIZE,
                (Math.random() - 0.5) * config.WORLD_SIZE
            );
            
            if (pos.length() > config.WORLD_SIZE * 0.45) continue;
            
            let valid = true;
            this.spheres.forEach(sphere => {
                if (pos.distanceTo(sphere.position) < sphere.radius + config.MIN_RADIUS * 2) {
                    valid = false;
                }
            });
            
            if (valid && !this.occupied.has(this.getPositionHash(pos))) {
                return pos;
            }
        }
        return null;
    }

    createSphere() {
        const pos = this.findValidPosition();
        if (!pos) {
            console.warn('Failed to create sphere after 100 attempts');
            return;
        }

        console.log('Creating sphere at:', pos);
        
        const sphere = {
            position: pos,
            radius: config.MIN_RADIUS,
            mesh: this.createSphereMesh(pos),
            growthSpeed: config.EXPANSION_RATE
        };
        
        this.occupied.add(this.getPositionHash(pos));
        this.spheres.push(sphere);
        this.scene.add(sphere.mesh);

        // Add axis helper
        const helper = new THREE.AxesHelper(20);
        sphere.mesh.add(helper);
    }

    createSphereMesh(pos) {
        const geometry = new THREE.SphereGeometry(config.MIN_RADIUS, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);
        return mesh;
    }

    canExpand(sphere) {
        if (sphere.radius >= config.MAX_RADIUS) return false;
        if (sphere.position.length() + sphere.radius >= config.WORLD_SIZE/2) return false;

        return this.spheres.every(other => {
            if (other === sphere) return true;
            const distance = sphere.position.distanceTo(other.position);
            return distance > (sphere.radius + other.radius);
        });
    }

    updateSpheres(deltaTime) {
        this.spheres.forEach(sphere => {
            if (this.canExpand(sphere)) {
                sphere.radius += sphere.growthSpeed * deltaTime;
                sphere.mesh.scale.setScalar(sphere.radius / config.MIN_RADIUS);
            }
        });
    }

    updateSpawnRate(deltaTime) {
        this.spawnTimer += deltaTime * 1000;
        const spawnInterval = config.INITIAL_SPAWN_DELAY * Math.exp(-config.SPAWN_GROWTH_FACTOR * this.spheres.length);
        
        if (this.spawnTimer > spawnInterval && this.spheres.length < config.MAX_SPHERES) {
            this.createSphere();
            this.spawnTimer = 0;
        }
    }

    animate(timestamp) {
        requestAnimationFrame((t) => this.animate(t));
        const deltaTime = ((timestamp - this.lastUpdate) / 1000 || 0) * this.speedMultiplier;
        this.lastUpdate = timestamp;
        this.frameCount++;

        if (this.autoRotate) {
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
