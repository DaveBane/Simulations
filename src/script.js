import * as THREE from 'three';

const config = {
  WORLD_RADIUS: 30,
  VOXEL_SIZE: 0.5,
  INITIAL_SPHERE_RADIUS: 1.5,
  EXPANSION_RATE: 0.1,
  SPAWN_INTERVAL: 1000,
  MAX_SPHERES: 50
};

// Voxel grid setup
const gridResolution = Math.ceil(config.WORLD_RADIUS * 2 / config.VOXEL_SIZE);
const voxelGrid = new Array(gridResolution).fill()
  .map(() => new Array(gridResolution).fill()
  .map(() => new Array(gridResolution).fill(false)));

// Convert world coordinates to grid indices
function toGridIndex(pos) {
  const offset = config.WORLD_RADIUS;
  return {
    x: Math.floor((pos.x + offset) / config.VOXEL_SIZE),
    y: Math.floor((pos.y + offset) / config.VOXEL_SIZE),
    z: Math.floor((pos.z + offset) / config.VOXEL_SIZE)
  };
}

// Check if position is within world sphere
function isInWorld(pos) {
  return pos.length() < config.WORLD_RADIUS;
}

class VoxelSphere {
  constructor() {
    this.color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
    this.mesh = new THREE.Group();
    this.activeVoxels = new Set();
    this.growthQueue = [];
    
    // Find valid starting position
    let pos;
    do {
      pos = new THREE.Vector3(
        (Math.random() - 0.5) * config.WORLD_RADIUS * 1.8,
        (Math.random() - 0.5) * config.WORLD_RADIUS * 1.8,
        (Math.random() - 0.5) * config.WORLD_RADIUS * 1.8
      );
    } while (!isInWorld(pos) || this.isPositionOccupied(pos));
    
    this.initialPosition = pos.clone();
    this.expand(config.INITIAL_SPHERE_RADIUS);
  }

  isPositionOccupied(pos) {
    const gridPos = toGridIndex(pos);
    return voxelGrid[gridPos.x]?.[gridPos.y]?.[gridPos.z] === true;
  }

  expand(radius) {
    const directions = [
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
    ];

    if (this.growthQueue.length === 0) {
      this.growthQueue.push(this.initialPosition.clone());
    }

    let expanded = false;
    const newQueue = [];

    for (const pos of this.growthQueue) {
      for (const dir of directions) {
        const newPos = pos.clone().add(dir.multiplyScalar(config.VOXEL_SIZE));
        const gridPos = toGridIndex(newPos);
        
        if (!isInWorld(newPos)) continue;
        if (voxelGrid[gridPos.x]?.[gridPos.y]?.[gridPos.z]) continue;
        
        // Mark voxel as occupied
        voxelGrid[gridPos.x][gridPos.y][gridPos.z] = true;
        
        // Create voxel visual
        const voxelGeo = new THREE.BoxGeometry(config.VOXEL_SIZE * 0.9);
        const voxelMat = new THREE.MeshPhongMaterial({ color: this.color });
        const voxelMesh = new THREE.Mesh(voxelGeo, voxelMat);
        voxelMesh.position.copy(newPos);
        this.mesh.add(voxelMesh);
        
        newQueue.push(newPos);
        expanded = true;
      }
    }

    this.growthQueue = newQueue;
    return expanded;
  }
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Camera
camera.position.z = config.WORLD_RADIUS * 2;

// Simulation state
const spheres = [];
let lastSpawn = 0;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Spawn new spheres
  if (spheres.length < config.MAX_SPHERES && Date.now() - lastSpawn > config.SPAWN_INTERVAL) {
    const sphere = new VoxelSphere();
    scene.add(sphere.mesh);
    spheres.push(sphere);
    lastSpawn = Date.now();
  }

  // Update spheres
  spheres.forEach(sphere => {
    if (sphere.expand(config.EXPANSION_RATE)) {
      sphere.mesh.rotation.x += 0.01;
      sphere.mesh.rotation.y += 0.01;
    }
  });

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
