document.addEventListener("DOMContentLoaded", async function () {
  // Create Three.js scene.
  const scene = new THREE.Scene();

  // Set up the camera.
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5
  );
  camera.position.z = 2;

  // Create the WebGL renderer and attach it to the page.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // API request to fetch simulation data.
  async function fetchSimulation() {
    try {
      const response = await fetch("/api/simulate");
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched simulation data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching simulation data:", error);
      return null;
    }
  }

  // Function to create a sphere in the Three.js scene.
  function createSphere(center, radius) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    // Adjust positions since simulation coordinates are in [0,1].
    sphere.position.set(center[0] - 0.5, center[1] - 0.5, center[2] - 0.5);
    scene.add(sphere);
  }

  // Function to render simulation data as 3D spheres.
  async function renderSimulation() {
    const simulationData = await fetchSimulation();
    if (!simulationData || simulationData.length === 0) {
      console.warn("No simulation data received.");
      return;
    }
    // For each snapshot, set a timeout to update the scene.
    simulationData.forEach(snapshot => {
      setTimeout(() => {
        console.log("Rendering snapshot at time:", snapshot.time);
        // Clear the scene.
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
        // Add each sphere in this snapshot.
        snapshot.spheres.forEach(sphereData => {
          createSphere(sphereData.center, sphereData.radius);
        });
      }, snapshot.time * 500); // Delay multiplier: adjust if needed.
    });
  }

  renderSimulation();

  // Animation loop: continuously render the scene.
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Adjust the renderer and camera on window resize.
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
