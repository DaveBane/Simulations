import * as THREE from 'three';

const config = {
  WORLD_SIZE: 500,
  MIN_RADIUS: 5,
  MAX_RADIUS: 50,
  EXPANSION_RATE: 0.3,
  SPAWN_INTERVAL: 1500,
  SPAWN_ACCELERATION: 0.97,
  MAX_SPHERES: 50
};

class ConsistentSphereSimulation {
  constructor() {
    this.spheres = [];
    this.occupied = new Set();
    this.lastSpawn = 0;
    this.spawnInterval = config.SPAWN_INTERVAL;

    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.z = config.WORLD_SIZE * 0.8;

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(500, 500, 500);
    this.scene.add(light);

    // Debug
    this.debugInfo = document.createElement('div');
    this.debugInfo.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      color: white;
      background: rgba(0,0,0,0.7);
      padding: 10px;
    `;
    document.body.appendChild(this.debugInfo);
  }

  hashPosition(pos) {
    return `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`;
  }

  createSphere() {
    let pos, valid = false;
    let attempts = 0;

    while (!valid && attempts < 1000) {
      pos = new THREE.Vector3(
        (Math.random() - 0.5) * config.WORLD_SIZE,
        (Math.random() - 0.5) * config.WORLD_SIZE,
        (Math.random() - 0.5) * config.WORLD_SIZE
      );
      valid = pos.length() < config.WORLD_SIZE/2 && 
        !this.occupied.has(this.hashPosition(pos));
      attempts++;
    }

    if (valid) {
      const sphere = {
        position: pos,
        radius: config.MIN_RADIUS,
        canGrow: true,
        mesh: this.createSphereMesh(pos)
      };
      this.markOccupied(sphere);
      this.spheres.push(sphere);
      this.scene.add(sphere.mesh);
    }
  }

  createSphereMesh(pos) {
    const geometry = new THREE.SphereGeometry(config.MIN_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
      transparent: true,
      opacity: 0.7
    });
    return new THREE.Mesh(geometry, material);
  }

  markOccupied(sphere) {
    const gridSize = 2 * Math.ceil(sphere.radius);
    for(let x = -gridSize; x <= gridSize; x++) {
      for(let y = -gridSize; y <= gridSize; y++) {
        for(let z = -gridSize; z <= gridSize; z++) {
          if(x*x + y*y + z*z <= sphere.radius*sphere.radius) {
            const pos = sphere.position.clone()
              .add(new THREE.Vector3(x, y, z));
            this.occupied.add(this.hashPosition(pos));
          }
        }
      }
    }
  }

  canExpand(sphere) {
    // Check boundary
    if(sphere.radius >= config.MAX_RADIUS) return false;
    if(sphere.position.length() + sphere.radius >= config.WORLD_SIZE/2) return false;

    // Check collisions with other spheres
    return this.spheres.every(other => {
      if(other === sphere) return true;
      const distance = sphere.position.distanceTo(other.position);
      return distance > (sphere.radius + other.radius);
    });
  }

  updateSpheres(deltaTime) {
    this.spheres.forEach(sphere => {
      if(!sphere.canGrow) return;

      // Update growth
      if(this.canExpand(sphere)) {
        sphere.radius += config.EXPANSION_RATE * deltaTime;
        sphere.mesh.scale.setScalar(sphere.radius / config.MIN_RADIUS);
        this.markOccupied(sphere);
      } else {
        sphere.canGrow = false;
      }
    });
  }

  animate(timestamp) {
    requestAnimationFrame((t) => this.animate(t));
    const deltaTime = (timestamp - this.lastUpdate) / 1000 || 0;
    this.lastUpdate = timestamp;

    // Spawn new spheres
    if(this.spheres.length < config.MAX_SPHERES && 
       timestamp - this.lastSpawn > this.spawnInterval) {
      this.createSphere();
      this.lastSpawn = timestamp;
      this.spawnInterval *= config.SPAWN_ACCELERATION;
    }

    // Update spheres
    this.updateSpheres(deltaTime);

    // Update debug
    this.debugInfo.textContent = `
      Active Spheres: ${this.spheres.length}
      Spawn Interval: ${Math.round(this.spawnInterval)}ms
      Growth Rate: ${config.EXPANSION_RATE.toFixed(1)} units/sec
    `;

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize and run
const sim = new ConsistentSphereSimulation();
sim.animate(performance.now());

// Camera controls
document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowUp') sim.camera.position.z *= 0.9;
  if(e.key === 'ArrowDown') sim.camera.position.z *= 1.1;
});

// Handle window resize
window.addEventListener('resize', () => {
  sim.camera.aspect = window.innerWidth / window.innerHeight;
  sim.camera.updateProjectionMatrix();
  sim.renderer.setSize(window.innerWidth, window.innerHeight);
});
