console.log('Script loaded'); // Confirm script is running

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5); // Positioned to view the scene
camera.lookAt(0, 0, 0);

// Renderer setup with transparency
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Transparent background to show body color
document.body.appendChild(renderer.domElement);

// OrbitControls for camera interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Volume cube (wireframe)
const L = 10;
const cubeGeometry = new THREE.BoxGeometry(L, L, L);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

// Add a test cube to verify rendering
const testCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const testCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const testCube = new THREE.Mesh(testCubeGeometry, testCubeMaterial);
testCube.position.set(0, 0, 0); // Center of the scene
scene.add(testCube);

// Parameters for sphere nucleation
const lambda0 = 0.01; // Increased for faster sphere creation
const k = 0.1;
const c = 1;
const dt = 0.1;
let t = 0;
const MAX_SPHERES = 256;
const spheres = [];

// Sample points for coverage check
const sampleSpacing = 0.5;
const samplePoints = [];
for (let x = -L / 2 + sampleSpacing / 2; x < L / 2; x += sampleSpacing) {
    for (let y = -L / 2 + sampleSpacing / 2; y < L / 2; y += sampleSpacing) {
        for (let z = -L / 2 + sampleSpacing / 2; z < L / 2; z += sampleSpacing) {
            samplePoints.push(new THREE.Vector3(x, y, z));
        }
    }
}

// Basic material for spheres
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Solid red

// Functions
function poisson(lambda) {
    let n = 0,
        p = Math.exp(-lambda),
        s = p,
        u = Math.random();
    while (u > s) {
        n++;
        p *= lambda / n;
        s += p;
    }
    return n;
}

function addSphere(center, t_n) {
    if (spheres.length >= MAX_SPHERES) return;
    const geometry = new THREE.SphereGeometry(0.5, 32, 32); // Start with radius 0.5
    const mesh = new THREE.Mesh(geometry, sphereMaterial);
    mesh.position.copy(center);
    scene.add(mesh);
    spheres.push({ mesh, center, t_n });
    console.log('Sphere added at', center, 'at t =', t_n, 'Total:', spheres.length);
}

function updateSpheres() {
    spheres.forEach((sphere) => {
        const r = Math.max(c * (t - sphere.t_n), 0.5); // Minimum radius of 0.5
        sphere.mesh.scale.set(r, r, r);
    });
}

function nucleate() {
    const lambda_t = lambda0 * Math.exp(k * t);
    const n_expected = lambda_t * (L * L * L) * dt; // Use L^3 for volume
    const n_attempt = poisson(n_expected);
    for (let i = 0; i < n_attempt; i++) {
        if (spheres.length >= MAX_SPHERES) break;
        const p = new THREE.Vector3(
            (Math.random() - 0.5) * L,
            (Math.random() - 0.5) * L,
            (Math.random() - 0.5) * L
        );
        let inside = false;
        for (const sphere of spheres) {
            const dist = p.distanceTo(sphere.center);
            const r = c * (t - sphere.t_n);
            if (dist < r) {
                inside = true;
                break;
            }
        }
        if (!inside) {
            addSphere(p, t);
        }
    }
}

function checkCoverage() {
    for (const point of samplePoints) {
        let covered = false;
        for (const sphere of spheres) {
            const dist = point.distanceTo(sphere.center);
            const r = c * (t - sphere.t_n);
            if (dist < r) {
                covered = true;
                break;
            }
        }
        if (!covered) return false;
    }
    return true;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    console.log('Animating at t =', t, 'with', spheres.length, 'spheres');
    t += dt;
    updateSpheres();
    nucleate();
    renderer.render(scene, camera);
    if (t % 1 < dt && checkCoverage()) {
        console.log('Simulation complete at t =', t);
        return;
    }
}
animate();
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
