import * as THREE from 'three';

// Configuration
const NUM_SPHERES = 50;
const BASE_GROWTH_RATE = 0.05;
const WORLD_RADIUS = 30;
const DIRECTIONAL_SEGMENTS = 64;

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
        this.growthVectors = new Array(DIRECTIONAL_SEGMENTS * DIRECTIONAL_SEGMENTS)
            .fill(BASE_GROWTH_RATE);
        
        // Random non-overlapping position within boundary
        let position = new THREE.Vector3();
        let validPosition = false;
        
        while (!validPosition) {
            // Generate random spherical coordinates
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = WORLD_RADIUS * Math.cbrt(Math.random()) * 0.8;
            
            position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            validPosition = this.validatePosition(position);
        }
        
        this.mesh.position.copy(position);
        scene.add(this.mesh);
        
        // Store vertex data
        this.originalVertices = this.geometry.attributes.position.array.slice();
        this.currentVertices = new Float32Array(this.originalVertices);
        this.vertexNormals = this.geometry.attributes.normal.array.slice();
    }

    validatePosition(position) {
        // Check boundary constraint
        if (position.length() >= WORLD_RADIUS - this.baseRadius) return false;
        
        // Check existing spheres
        return scene.children.every(obj => {
            if (!(obj instanceof THREE.Mesh) || obj === this.mesh) return true;
            const distance = position.distanceTo(obj.position);
            return distance > (this.baseRadius + obj.userData.baseRadius);
        });
    }

    calculateGrowthConstraints() {
        const constraints = new Array(this.growthVectors.length).fill(1);
        const position = this.mesh.position;
        
        // Boundary constraint
        const toBoundary = WORLD_RADIUS - position.length();
        const boundaryGrowthLimit = Math.max(0, toBoundary - this.baseRadius);
        
        // Check collisions with other spheres
        scene.children.forEach(other => {
            if (other === this.mesh || !other.userData) return;
            
            const otherSphere = other.userData.instance;
            const direction = new THREE.Vector3()
                .subVectors(otherSphere.mesh.position, position)
                .normalize();
            const distance = position.distanceTo(otherSphere.mesh.position);
            const minDistance = this.baseRadius + otherSphere.baseRadius;
            
            if (distance < minDistance + BASE_GROWTH_RATE) {
                this.applyDirectionalConstraint(constraints, direction);
            }
        });

        // Apply boundary constraints
        if (toBoundary < this.baseRadius * 2) {
            const boundaryDirection = position.clone().normalize();
            this.applyDirectionalConstraint(constraints, boundaryDirection);
        }

        return constraints;
    }

    applyDirectionalConstraint(constraints, direction) {
        for (let i = 0; i < this.vertexNormals.length; i += 3) {
            const normal = new THREE.Vector3(
                this.vertexNormals[i],
                this.vertexNormals[i+1],
                this.vertexNormals[i+2]
            ).normalize();
            
            const dot = normal.dot(direction);
            if (dot > 0.7) { // Vertex facing constraint direction
                const vertexIndex = Math.floor(i/3);
                constraints[vertexIndex] = 0;
            }
        }
    }

    update() {
        const growthConstraints = this.calculateGrowthConstraints();
        let maxRadius = 0;

        // Update vertices with constraints
        for (let i = 0; i < this.originalVertices.length; i += 3) {
            const vertexIndex = i/3;
            const growthFactor = this.growthVectors[vertexIndex] * growthConstraints[vertexIndex];
            
            const vx = this.originalVertices[i] * growthFactor;
            const vy = this.originalVertices[i+1] * growthFactor;
            const vz = this.originalVertices[i+2] * growthFactor;
            
            this.currentVertices[i] += vx;
            this.currentVertices[i+1] += vy;
            this.currentVertices[i+2] += vz;
            
            // Track maximum radius
            const currentLength = Math.sqrt(
                this.currentVertices[i] ** 2 +
                this.currentVertices[i+1] ** 2 +
                this.currentVertices[i+2] ** 2
            );
            maxRadius = Math.max(maxRadius, currentLength);
        }

        // Enforce absolute boundary constraint
        const worldSpaceRadius = maxRadius + this.mesh.position.length();
        if (worldSpaceRadius >= WORLD_RADIUS) {
            const scaleFactor = (WORLD_RADIUS - this.mesh.position.length()) / maxRadius;
            for (let i = 0; i < this.currentVertices.length; i++) {
                this.currentVertices[i] *= scaleFactor;
            }
        }

        // Update geometry
        this.geometry.attributes.position.array = this.currentVertices;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.baseRadius = maxRadius;
    }
}

// Boundary visualization
const boundaryGeometry = new THREE.SphereGeometry(WORLD_RADIUS, 64, 64);
const boundaryMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x444444,
    wireframe: true
});
const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
scene.add(boundary);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animation loop
let spheres = [];
function animate() {
    requestAnimationFrame(animate);

    if (spheres.length < NUM_SPHERES && Math.random() < 0.03) {
        const sphere = new GrowingSphere();
        sphere.mesh.userData = {
            baseRadius: sphere.baseRadius,
            instance: sphere
        };
        spheres.push(sphere);
    }

    spheres.forEach(sphere => sphere.update());
    renderer.render(scene, camera);
}

// Camera setup
camera.position.z = WORLD_RADIUS * 2.5;

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
