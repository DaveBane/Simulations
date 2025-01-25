import * as THREE from 'three';

const config = {
  WORLD_SIZE: 1000,
  VOXEL_SIZE: 1,
  EXPANSION_RATE: 1,
  INITIAL_SPAWN_RATE: 0.01,
  SPAWN_GROWTH_RATE: 0.005,
  MAX_SPHERES: 500
};

class VoxelSimulation {
  constructor() {
    this.activated = new Set();
    this.spheres = [];
    this.time = 0;
    this.nextSpawnTime = 0;
    
    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.z = config.WORLD_SIZE * 1.5;

    // Spatial optimization
    this.occupiedRegions = new Map();
  }

  hashPosition(x, y, z) {
    return `${Math.floor(x/10)},${Math.floor(y/10)},${Math.floor(z/10)}`;
  }

  isOccupied(x, y, z) {
    const region = this.hashPosition(x, y, z);
    return this.occupiedRegions.has(region) && this.occupiedRegions.get(region).has(`${x},${y},${z}`);
  }

  markOccupied(x, y, z) {
    const region = this.hashPosition(x, y, z);
    if (!this.occupiedRegions.has(region)) {
      this.occupiedRegions.set(region, new Set());
    }
    this.occupiedRegions.get(region).add(`${x},${y},${z}`);
  }

  getRandomPosition() {
    return new THREE.Vector3(
      Math.floor(Math.random() * config.WORLD_SIZE - config.WORLD_SIZE/2),
      Math.floor(Math.random() * config.WORLD_SIZE - config.WORLD_SIZE/2),
      Math.floor(Math.random() * config.WORLD_SIZE - config.WORLD_SIZE/2)
    );
  }

  spawnSphere() {
    let pos;
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 1000) {
      pos = this.getRandomPosition();
      valid = !this.isOccupied(pos.x, pos.y, pos.z) && 
        pos.distanceTo(new THREE.Vector3(0, 0, 0)) < config.WORLD_SIZE/2;
      attempts++;
    }
    
    if (valid) {
      this.spheres.push({
        position: pos,
        frontier: [pos.clone()],
        mesh: this.createSphereMesh(pos)
      });
      this.markOccupied(pos.x, pos.y, pos.z);
      this.scene.add(this.spheres[this.spheres.length-1].mesh);
    }
  }

  createSphereMesh(position) {
    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    return mesh;
  }

  expandSpheres() {
    this.spheres.forEach(sphere => {
      const newFrontier = [];
      sphere.frontier.forEach(voxel => {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              
              const x = voxel.x + dx * config.EXPANSION_RATE;
              const y = voxel.y + dy * config.EXPANSION_RATE;
              const z = voxel.z + dz * config.EXPANSION_RATE;
              const pos = new THREE.Vector3(x, y, z);
              
              if (!this.isOccupied(x, y, z) && pos.distanceTo(new THREE.Vector3(0, 0, 0)) < config.WORLD_SIZE/2) {
                this.markOccupied(x, y, z);
                newFrontier.push(pos);
                this.updateSphereVisual(sphere, pos);
              }
            }
          }
        }
      });
      sphere.frontier = newFrontier;
    });
  }

  updateSphereVisual(sphere, position) {
    sphere.mesh.scale.x += 0.1;
    sphere.mesh.scale.y += 0.1;
    sphere.mesh.scale.z += 0.1;
  }

  updateSpawnRate() {
    return config.INITIAL_SPAWN_RATE * Math.exp(config.SPAWN_GROWTH_RATE * this.time);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update simulation
    this.time++;
    if (this.spheres.length < config.MAX_SPHERES && this.time >= this.nextSpawnTime) {
      this.spawnSphere();
      this.nextSpawnTime = this.time + Math.floor(-Math.log(Math.random()) / this.updateSpawnRate());
    }
    
    this.expandSpheres();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize simulation
const sim = new VoxelSimulation();
sim.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(100, 100, 100);
sim.scene.add(light);
sim.animate();

// Handle window resize
window.addEventListener('resize', () => {
  sim.camera.aspect = window.innerWidth / window.innerHeight;
  sim.camera.updateProjectionMatrix();
  sim.renderer.setSize(window.innerWidth, window.innerHeight);
});
