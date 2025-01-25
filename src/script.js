import * as THREE from 'three';

// Configuration
const NUM_SPHERES = 100;
const GROWTH_RATE = 0.1;
const SPAWN_INTERVAL = 1000; // ms
const WORLD_SIZE = 50;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera position
camera.position.z = WORLD_SIZE * 1.5;

// Sphere class
class GrowingSphere {
    constructor() {
        this.geometry = new THREE.SphereGeometry(1, 32, 32);
        this.material = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.radius = 0.1;
        this.isGrowing = true;
        
        // Random position that doesn't overlap
        do {
            this.mesh.position.set(
                (Math.random() - 0.5) * WORLD_SIZE * 2,
                (Math.random() - 0.5) * WORLD_SIZE * 2,
                (Math.random() - 0.5) * WORLD_SIZE * 2
            );
        } while (this.checkCollisions());
        
        scene.add(this.mesh);
    }

    checkCollisions() {
        const spheres = scene.children.filter(obj => obj instanceof THREE.Mesh);
        return spheres.some(existing => {
            const distance = this.mesh.position.distanceTo(existing.position);
            return distance < (this.radius + existing.userData.radius);
        });
    }

    update() {
        if (!this.isGrowing) return;
        
        // Check collisions
        const spheres = scene.children.filter(obj => obj !== this.mesh);
        let collision = false;
        
        spheres.forEach(existing => {
            const distance = this.mesh.position.distanceTo(existing.position);
            if (distance < (this.radius + existing.userData.radius)) {
                collision = true;
                existing.userData.instance.isGrowing = false;
            }
        });

        if (collision) {
            this.isGrowing = false;
            return;
        }

        // Grow sphere
        this.radius += GROWTH_RATE;
        this.mesh.scale.set(this.radius, this.radius, this.radius);
    }
}

// Add ambient light
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Animation loop
let spheres = [];
function animate() {
    requestAnimationFrame(animate);
    
    // Update sphere count display
    document.getElementById('info').textContent = `Spheres: ${spheres.length}`;

    // Add new spheres exponentially
    if (spheres.length < NUM_SPHERES && Math.random() < 0.05) {
        const sphere = new GrowingSphere();
        spheres.push(sphere);
    }

    // Update all spheres
    spheres.forEach(sphere => sphere.update());
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start simulation
animate();
