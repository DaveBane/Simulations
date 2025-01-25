import * as THREE from 'three';

// Configuration with debug parameters
const CONFIG = {
  NUM_SPHERES: 30,
  BASE_GROWTH_RATE: 0.3,
  WORLD_RADIUS: 20,
  DIRECTIONAL_SEGMENTS: 32,
  SPAWN_RATE: 0.1,
  INITIAL_RADIUS: 0.5,
  CAMERA_DISTANCE_MULTIPLIER: 2.0
};

// Debug setup
const debug = {
  totalSpheres: 0,
  failedSpawns: 0
};

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Coordinate axes helper (debug)
const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

class GrowingSphere {
    constructor() {
        this.geometry = new THREE.SphereGeometry(1, CONFIG.DIRECTIONAL_SEGMENTS, CONFIG.DIRECTIONAL_SEGMENTS);
        this.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
            transparent: true,
            opacity: 0.9,
            wireframe: false
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.baseRadius = CONFIG.INITIAL_RADIUS;
        this.growthVectors = new Array(CONFIG.DIRECTIONAL_SEGMENTS * CONFIG.DIRECTIONAL_SEGMENTS)
            .fill(CONFIG.BASE_GROWTH_RATE);
        
        // Generate initial position
        const position = this.generateValidPosition();
        if (!position) {
            debug.failedSpawns++;
            return;
        }
        
        this.mesh.position.copy(position);
        scene.add(this.mesh);
        debug.totalSpheres++;

        // Store geometry data
        this.originalVertices = this.geometry.attributes.position.array.slice();
        this.currentVertices = new Float32Array(this.originalVertices);
        this.vertexNormals = this.geometry.attributes.normal.array.slice();
    }

    generateValidPosition() {
        const maxAttempts = 100;
        let attempt = 0;
        
        while (attempt < maxAttempts) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = CONFIG.WORLD_RADIUS * Math.cbrt(Math.random()) * 0.7;
            
            const position = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );

            if (this.validatePosition(position)) {
                return position;
            }
            attempt++;
        }
        return null;
    }

    validatePosition(position) {
        // Check boundary constraint
        if (position.length() >= CONFIG.WORLD_RADIUS - this.baseRadius) {
            return false;
        }
        
        // Check existing spheres
        return scene.children.every(obj => {
            if (!(obj instanceof THREE.Mesh) || obj === this.mesh) return true;
            const distance = position.distanceTo(obj.position);
            return distance > (this.baseRadius + obj.userData?.baseRadius);
        });
    }

    update() {
        if (!this.mesh.parent) return; // Skip if not added to scene
        
        const growthConstraints = this.calculateGrowthConstraints();
        let maxRadius = 0;

        // Update vertices with constraints
        for (let i = 0; i < this.originalVertices.length; i += 3) {
            const vertexIndex = i/3;
            const growthFactor = this.growthVectors[vertexIndex] * growthConstraints[vertexIndex];
            
            this.currentVertices[i] += this.originalVertices[i] * growthFactor;
            this.currentVertices[i+1] += this.originalVertices[i+1] * growthFactor;
            this.currentVertices[i+2] += this.originalVertices[i+2] * growthFactor;
            
            const currentLength = Math.sqrt(
                this.currentVertices[i] ** 2 +
                this.currentVertices[i+1] ** 2 +
                this.currentVertices[i+2] ** 2
            );
            maxRadius = Math.max(maxRadius, currentLength);
        }

        // Update geometry
        this.geometry.attributes.position.array = this.currentVertices;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.baseRadius = maxRadius;
        
        // Update userData for collision detection
        this.mesh.userData = {
            baseRadius: this.baseRadius,
            instance: this
        };
    }

    // ... rest of the class remains the same ...
}

// Boundary visualization
const boundaryGeometry = new THREE.SphereGeometry(CONFIG.WORLD_RADIUS, 64, 64);
const boundaryMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFF0000,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
scene.add(boundary);

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Camera setup
camera.position.z = CONFIG.WORLD_RADIUS * CONFIG.CAMERA_DISTANCE_MULTIPLIER;
camera.lookAt(0, 0, 0);

// Animation loop with debug info
let spheres = [];
function animate() {
    requestAnimationFrame(animate);

    // Spawn new spheres
    if (spheres.length < CONFIG.NUM_SPHERES && Math.random() < CONFIG.SPAWN_RATE) {
        const sphere = new GrowingSphere();
        if (sphere.mesh.parent) { // Only add successful spawns
            spheres.push(sphere);
        }
    }

    // Update debug info
    document.getElementById('info').innerHTML = `
        Spheres: ${debug.totalSpheres}<br>
        Failed Spawns: ${debug.failedSpawns}<br>
        Camera Distance: ${camera.position.z.toFixed(1)}
    `;

    // Update spheres
    spheres.forEach(sphere => sphere.update());
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Debug controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') camera.position.z *= 0.9;
    if (e.key === 'ArrowDown') camera.position.z *= 1.1;
    if (e.key === 'r') camera.position.z = CONFIG.WORLD_RADIUS * CONFIG.CAMERA_DISTANCE_MULTIPLIER;
});
