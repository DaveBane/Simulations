// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Volume cube
const L = 10;
const V = L * L * L;
const cubeGeometry = new THREE.BoxGeometry(L, L, L);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

// Parameters
const lambda0 = 0.001;
const k = 0.1;
const c = 1;
const dt = 0.1;
let t = 0;
const MAX_SPHERES = 256;
const spheres = [];
let sphereIndex = 0;

// Sample points
const sampleSpacing = 0.5;
const samplePoints = [];
for(let x = -L/2 + sampleSpacing/2; x < L/2; x += sampleSpacing) {
    for(let y = -L/2 + sampleSpacing/2; y < L/2; y += sampleSpacing) {
        for(let z = -L/2 + sampleSpacing/2; z < L/2; z += sampleSpacing) {
            samplePoints.push(new THREE.Vector3(x, y, z));
        }
    }
}

// Custom shader
const sphereVertexShader = `
    varying vec3 vWorldPosition;
    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const sphereFragmentShader = `
    uniform vec3 centers[256];
    uniform float radii[256];
    uniform int currentIndex;
    varying vec3 vWorldPosition;
    void main() {
        for(int i = 0; i < 256; i++) {
            if(i != currentIndex && radii[i] > 0.0) {
                float dist = length(vWorldPosition - centers[i]);
                if(dist < radii[i]) {
                    discard;
                }
            }
        }
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;
const sphereMaterial = new THREE.ShaderMaterial({
    vertexShader: sphereVertexShader,
    fragmentShader: sphereFragmentShader,
    uniforms: {
        centers: { value: new Array(MAX_SPHERES).fill(new THREE.Vector3()) },
        radii: { value: new Array(MAX_SPHERES).fill(0) },
        currentIndex: { value: 0 }
    }
});

// Intersection material
const intersectionMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

// Functions
function poisson(lambda) {
    let n = 0, p = Math.exp(-lambda), s = p, u = Math.random();
    while(u > s) { n++; p *= lambda / n; s += p; }
    return n;
}

function addSphere(center, t_n) {
    if(spheres.length >= MAX_SPHERES) return;
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const mesh = new THREE.Mesh(geometry, sphereMaterial.clone());
    mesh.position.copy(center);
    mesh.scale.set(0, 0, 0);
    mesh.index = sphereIndex++;
    scene.add(mesh);
    spheres.push({ mesh, center, t_n });
    mesh.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
        material.uniforms.currentIndex.value = this.index;
    };
}

function updateSpheres() {
    spheres.forEach(sphere => {
        const r = c * (t - sphere.t_n);
        sphere.mesh.scale.set(r, r, r);
    });
}

function nucleate() {
    const lambda_t = lambda0 * Math.exp(k * t);
    const n_expected = lambda_t * V * dt;
    const n_attempt = poisson(n_expected);
    for(let i = 0; i < n_attempt; i++) {
        if(spheres.length >= MAX_SPHERES) break;
        const p = new THREE.Vector3((Math.random() - 0.5) * L, (Math.random() - 0.5) * L, (Math.random() - 0.5) * L);
        let inside = false;
        for(const sphere of spheres) {
            const dist = p.distanceTo(sphere.center);
            const r = c * (t - sphere.t_n);
            if(dist < r) { inside = true; break; }
        }
        if(!inside) addSphere(p, t);
    }
}

function updateUniforms() {
    const centers = spheres.map(s => s.center);
    const radii = spheres.map(s => c * (t - s.t_n));
    while(centers.length < MAX_SPHERES) {
        centers.push(new THREE.Vector3());
        radii.push(0);
    }
    spheres.forEach(s => {
        s.mesh.material.uniforms.centers.value = centers;
        s.mesh.material.uniforms.radii.value = radii;
    });
}

function updateIntersections() {
    scene.children.forEach(child => {
        if(child.isIntersectionLine) scene.remove(child);
    });
    for(let i = 0; i < spheres.length; i++) {
        for(let j = i + 1; j < spheres.length; j++) {
            const s1 = spheres[i], s2 = spheres[j];
            const c1 = s1.center, c2 = s2.center;
            const r1 = c * (t - s1.t_n), r2 = c * (t - s2.t_n);
            const d = c1.distanceTo(c2);
            if(d < r1 + r2 && d > Math.abs(r1 - r2)) {
                const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
                const h = Math.sqrt(r1 * r1 - a * a);
                const center = c1.clone().lerp(c2, a / d);
                const normal = c2.clone().sub(c1).normalize();
                const tangent = new THREE.Vector3(0,1,0).cross(normal).normalize();
                if(tangent.lengthSq() < 0.0001) tangent = new THREE.Vector3(1,0,0).cross(normal).normalize();
                const bitangent = normal.cross(tangent).normalize();
                const points = [];
                const numPoints = 64;
                for(let k = 0; k < numPoints; k++) {
                    const angle = 2 * Math.PI * k / numPoints;
                    points.push(center.clone().add(tangent.clone().multiplyScalar(h * Math.cos(angle))).add(bitangent.clone().multiplyScalar(h * Math.sin(angle))));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.LineLoop(geometry, intersectionMaterial);
                line.isIntersectionLine = true;
                scene.add(line);
            }
        }
    }
}

function checkCoverage() {
    for(const point of samplePoints) {
        let covered = false;
        for(const sphere of spheres) {
            const dist = point.distanceTo(sphere.center);
            const r = c * (t - sphere.t_n);
            if(dist < r) { covered = true; break; }
        }
        if(!covered) return false;
    }
    return true;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    t += dt;
    updateSpheres();
    nucleate();
    updateUniforms();
    updateIntersections();
    renderer.render(scene, camera);
    if(t % 1 < dt && checkCoverage()) {
        console.log('Simulation complete at t =', t);
        return;
    }
}
animate();
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
