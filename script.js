document.addEventListener("DOMContentLoaded", async function () {
  // Create a Three.js scene.
  const scene = new THREE.Scene();

  // Set up a camera with perspective projection.
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5
  );
  camera.position.z = 2;

  // Create the renderer and attach its canvas to the container.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Fetch simulation data from the backend API.
  async function fetchSimulation() {
    try {
      const response = await fetch("/api/simulate");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching simulation data:", error);
    }
  }

  // Create a sphere mesh and add it to the scene.
  function createSphere(center, radius) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    // Adjust positions since simulation coordinates are in [0,1].
    sphere.position.set(center[0] - 0.5, center[1] - 0.5, center[2] - 0.5);
    scene.add(sphere);
  }

  // Render simulation snapshots with a delay between them.
  async function renderSimulation() {
    const simulationData = await fetchSimulation();
    if (!simulationData) return;

    simulationData.forEach(snapshot => {
      setTimeout(() => {
        // Clear any existing objects from the scene.
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
        // Add each sphere in this snapshot.
        snapshot.spheres.forEach(sphereData => {
          createSphere(sphereData.center, sphereData.radius);
        });
      }, snapshot.time * 500); // Adjust the delay multiplier as needed.
    });
  }

  renderSimulation();

  // Animation loop: render the scene continuously.
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Adjust the renderer and camera on window resize.
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
