import * as THREE from 'three';

const config = {
  WORLD_SIZE: 1000,
  VOXEL_SIZE: 5,
  EXPANSION_RATE: 0.1,
  INITIAL_SPAWN_INTERVAL: 2000,
  SPAWN_ACCELERATION: 0.95,
  MAX_SPHERES: 100,
  TIME_SCALE: 0.1
};

class SphereSimulation {
  constructor() {
    this.occupied = new Set();
    this.spheres = [];
    this.spawnInterval = config.INITIAL_SPAWN_INTERVAL;
    this.lastSpawn = 0;
    this.lastUpdate = 0;

    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.camera.position.z = config.WORLD_SIZE * 0.8;

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1000, 1000, 1000);
    this.scene.add(light);

    // Debug panel
    this.debugInfo = document.createElement('div');
    this.debugInfo.style.position = 'fixed';
    this.debugInfo.style.top = '10px';
    this.debugInfo.style.left = '10px';
    this.debugInfo.style.color = 'white';
    document.body.appendChild(this.debugInfo);
  }

  getVoxelKey(pos) {
    return `${Math.floor(pos.x/config.VOXEL_SIZE)},${Math.floor(pos.y/config.VOXEL_SIZE)},${Math.floor(pos.z/config.VOXEL_SIZE)}`;
  }

  createSphere() {
    let pos;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 1000) {
      pos = new THREE.Vector3(
        (Math.random() - 0.5) * config.WORLD_SIZE,
        (Math.random() - 0.5) * config.WORLD_SIZE,
        (Math.random() - 0.5) * config.WORLD_SIZE
      );
      valid = !this.occupied.has(this.getVoxelKey(pos)) && 
        pos.length() < config.WORLD_SIZE/2;
      attempts++;
    }

    if (valid) {
      const sphere = {
        position: pos,
        radius: config.VOXEL_SIZE,
        mesh: this.createSphereMesh(pos),
        growthQueue: [pos.clone()]
      };
      this.occupied.add(this.getVoxelKey(pos));
      this.spheres.push(sphere);
      this.scene.add(sphere.mesh);
    }
  }

  createSphereMesh(pos) {
    const geometry = new THREE.SphereGeometry(config.VOXEL_SIZE/2, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    return mesh;
  }

  expandSphere(sphere) {
    const newQueue = [];
    const directions = [
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
    ];

    sphere.growthQueue.forEach(pos => {
      directions.forEach(dir => {
        const newPos = pos.clone().add(dir.multiplyScalar(config.VOXEL_SIZE));
        const key = this.getVoxelKey(newPos);
        
        if (!this.occupied.has(key) && newPos.length() < config.WORLD_SIZE/2) {
          this.occupied.add(key);
          newQueue.push(newPos);
          this.updateSphereVisual(sphere, newPos);
        }
      });
    });

    sphere.growthQueue = newQueue;
  }

  updateSphereVisual(sphere, newPos) {
    sphere.radius += config.EXPANSION_RATE;
    sphere.mesh.scale.set(
      sphere.radius / (config.VOXEL_SIZE/2),
      sphere.radius / (config.VOXEL_SIZE/2),
      sphere.radius / (config.VOXEL_SIZE/2)
    );
  }

  animate(timestamp) {
    requestAnimationFrame((t) => this.animate(t));

    const deltaTime = timestamp - this.lastUpdate;
    this.lastUpdate = timestamp;

    // Spawn new spheres
    if (this.spheres.length < config.MAX_SPHERES && 
        timestamp - this.lastSpawn > this.spawnInterval) {
      this.createSphere();
      this.lastSpawn = timestamp;
      this.spawnInterval *= config.SPAWN_ACCELERATION;
    }

    // Expand existing spheres
    this.spheres.forEach(sphere => {
      this.expandSphere(sphere);
    });

    // Update debug info
    this.debugInfo.textContent = `
      Active Spheres: ${this.spheres.length}
      Spawn Interval: ${Math.round(this.spawnInterval)}ms
      World Size: ${config.WORLD_SIZE}
      Voxel Size: ${config.VOXEL_SIZE}
    `;

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize and run simulation
const sim = new SphereSimulation();
sim.animate(performance.now());

// Camera controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') sim.camera.position.z *= 0.9;
  if (e.key === 'ArrowDown') sim.camera.position.z *= 1.1;
});

// Window resize handler
window.addEventListener('resize', () => {
  sim.camera.aspect = window.innerWidth / window.innerHeight;
  sim.camera.updateProjectionMatrix();
  sim.renderer.setSize(window.innerWidth, window.innerHeight);
});
