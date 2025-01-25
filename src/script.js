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

class MultiSphereSimulation {
  constructor() {
    this.spheres = [];
    this.occupied = new Set();
    this.spawnTimer = 0;
    this.spawnRate = 1;
    this.frameCount = 0;

    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 5000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.z = config.WORLD_SIZE * 0.7;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(300, 300, 300);
    this.scene.add(directional);

    // Debug
    this.debugInfo = document.createElement('div');
    this.debugInfo.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      color: white;
      background: rgba(0,0,0,0.7);
      padding: 10px;
      font-family: monospace;
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
    if (!pos) return;

    const sphere = {
      position: pos,
      radius: config.MIN_RADIUS,
      mesh: this.createSphereMesh(pos),
      growthSpeed: config.EXPANSION_RATE
    };
    
    this.occupied.add(this.getPositionHash(pos));
    this.spheres.push(sphere);
    this.scene.add(sphere.mesh);
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

  updateSpheres(deltaTime) {
    this.spheres.forEach(sphere => {
      // Check boundary collision
      const boundaryDistance = config.WORLD_SIZE * 0.5 - sphere.position.length();
      if (boundaryDistance < sphere.radius + 5) {
        return;
      }

      // Check sphere collisions
      let collision = false;
      this.spheres.forEach(other => {
        if (other === sphere) return;
        const distance = sphere.position.distanceTo(other.position);
        if (distance < sphere.radius + other.radius) {
          collision = true;
        }
      });

      if (!collision) {
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
    const deltaTime = (timestamp - this.lastUpdate) / 1000 || 0;
    this.lastUpdate = timestamp;
    this.frameCount++;

    this.updateSpheres(deltaTime);
    this.updateSpawnRate(deltaTime);

    // Update debug info every 10 frames
    if (this.frameCount % 10 === 0) {
      this.debugInfo.innerHTML = `
        Active Spheres: ${this.spheres.length}<br>
        Spawn Attempts: ${config.SPAWN_ATTEMPTS}<br>
        Current Growth Rate: ${config.EXPANSION_RATE.toFixed(1)} units/sec<br>
        World Radius: ${config.WORLD_SIZE/2}<br>
        Next Sphere In: ${(config.INITIAL_SPAWN_DELAY * Math.exp(-config.SPAWN_GROWTH_FACTOR * this.spheres.length)).toFixed(0)}ms
      `;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize and run
const sim = new MultiSphereSimulation();
sim.animate(performance.now());

// Camera controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') sim.camera.position.z *= 0.9;
  if (e.key === 'ArrowDown') sim.camera.position.z *= 1.1;
});

// Handle window resize
window.addEventListener('resize', () => {
  sim.camera.aspect = window.innerWidth / window.innerHeight;
  sim.camera.updateProjectionMatrix();
  sim.renderer.setSize(window.innerWidth, window.innerHeight);
});
