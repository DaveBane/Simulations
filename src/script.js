import * as THREE from 'three';

// Configuration
const NUM_SPHERES = 100;
const BASE_GROWTH_RATE = 0.1;
const WORLD_RADIUS = 30;
const DIRECTIONAL_SEGMENTS = 32; // Resolution of growth directions

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

class GrowingSphere {
    constructor() {
        this.geometry = new THREE.SphereGeometry(1, DIRECTIONAL_SEGMENTS, DIRECTIONAL_SEGMENTS);
        this.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.baseRadius = 0.1;
        this.growthVectors = new Float32Array(DIRECTIONAL_SEGMENTS * DIRECTIONAL_SEGMENTS).fill(BASE_GROWTH_RATE);
        
        // Generate random position within spherical volume
        let position = new THREE.Vector3();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = WORLD_RADIUS * Math.cbrt(Math.random());
        
        position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        
        this.mesh.position.copy(position);
        scene.add(this.mesh);
        
        // Store vertex positions for growth calculations
        this.originalVertices = this.geometry.attributes.position.array.slice();
        this.currentVertices = new Float32Array(this.originalVertices);
    }

    calculateGrowthConstraints() {
        const constraints = new Float32Array(this.growthVectors.length).fill(1);
        const position = this.mesh.position;
        const worldPosition = new THREE.Vector3();
        
        // Check boundary constraints
        const distanceToEdge = WORLD_RADIUS - position.length();
        
        // Check sphere collisions
        scene.children.forEach(other => {
            if (other === this.mesh) return;
            
            const otherPosition = other.position;
            const distance = position.distanceTo(otherPosition);
            const combinedRadius = this.baseRadius + (other.userData?.baseRadius || 0);
            
            if (distance < combinedRadius * 1.1) {
                const collisionDirection = new THREE.Vector3()
                    .subVectors(position, otherPosition)
                    .normalize();
                
                // Update growth constraints based on collision direction
                this.geometry.attributes.position.array.forEach((v, i) => {
                    const vertex = new THREE.Vector3(
                        this.currentVertices[i*3],
                        this.currentVertices[i*3+1],
                        this.currentVertices[i*3+2]
                    ).normalize();
                    
                    const dot = vertex.dot(collisionDirection);
                    if (dot > 0.7) { // Vertex facing collision
                        constraints[Math.floor(i/3)] = 0;
                    }
                });
            }
        });

        // Apply boundary constraints
        if (distanceToEdge < this.baseRadius * 2) {
            const boundaryNormal = position.clone().normalize();
            this.geometry.attributes.position.array.forEach((v, i) => {
                const vertex = new THREE.Vector3(
                    this.currentVertices[i*3],
                    this.currentVertices[i*3+1],
                    this.currentVertices[i*3+2]
                ).normalize();
                
                const dot = vertex.dot(boundaryNormal);
                if (dot > 0.7) { // Vertex facing boundary
                    constraints[Math.floor(i/3)] = 0;
                }
            });
        }

        return constraints;
    }

    update() {
        const growthConstraints = this.calculateGrowthConstraints();
        
        // Update vertices based on growth vectors
        for (let i = 0; i < this.originalVertices.length; i += 3) {
            const vertexIndex = i/3;
            const growthFactor = this.growthVectors[vertexIndex] * growthConstraints[vertexIndex];
            
            const dx = this.originalVertices[i] * growthFactor;
            const dy = this.originalVertices[i+1] * growthFactor;
            const dz = this.originalVertices[i+2] * growthFactor;
            
            this.currentVertices[i] += dx;
            this.currentVertices[i+1] += dy;
            this.currentVertices[i+2] += dz;
        }

        // Update geometry and base radius
        this.geometry.attributes.position.array = this.currentVertices;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.baseRadius += BASE_GROWTH_RATE * 0.1;
    }
}

// Add boundary visualization
const boundaryGeometry = new THREE.SphereGeometry(WORLD_RADIUS, 64, 64);
const boundaryMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x444444,
    wireframe: true
});
const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
scene.add(boundary);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animation loop
let spheres = [];
function animate() {
    requestAnimationFrame(animate);

    // Spawn new spheres
    if (spheres.length < NUM_SPHERES && Math.random() < 0.05) {
        const sphere = new GrowingSphere();
        spheres.push(sphere);
    }

    // Update all spheres
    spheres.forEach(sphere => sphere.update());
    renderer.render(scene, camera);
}

// Camera position
camera.position.z = WORLD_RADIUS * 2.5;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
