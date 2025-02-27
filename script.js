// Create the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.z = 20; // Position camera outside the boundary

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lighting
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);
scene.add(new THREE.AmbientLight(0x404040)); // Soft ambient light

// Create the boundary sphere (wireframe)
const boundaryGeometry = new THREE.SphereGeometry(1, 32, 32);
const boundaryMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, // Green
    wireframe: true 
});
const boundarySphere = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
boundarySphere.scale.set(10, 10, 10); // Effective radius = 10 units
scene.add(boundarySphere);

// Create the expanding sphere
const expandingGeometry = new THREE.SphereGeometry(1, 32, 32);
const expandingMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff0000, // Red
    transparent: true, 
    opacity: 0.5 // Semi-transparent to see boundary
});
const expandingSphere = new THREE.Mesh(expandingGeometry, expandingMaterial);
expandingSphere.scale.set(1, 1, 1); // Initial radius = 1 unit
scene.add(expandingSphere);

// Animation variables
let isRunning = true;
const growthRate = 1; // Radius increases by 1 unit per second
const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (isRunning) {
        const delta = clock.getDelta(); // Time since last frame
        // Increase scale uniformly
        expandingSphere.scale.x += growthRate * delta;
        expandingSphere.scale.y += growthRate * delta;
        expandingSphere.scale.z += growthRate * delta;

        // Check if expanding sphere fills the boundary
        if (expandingSphere.scale.x >= boundarySphere.scale.x) {
            isRunning = false;
            document.getElementById('message').style.display = 'block';
        }
    }

    renderer.render(scene, camera);
}

animate();
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
