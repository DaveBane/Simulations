document.addEventListener("DOMContentLoaded", async function () {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    async function fetchSimulation() {
        let response = await fetch("/api/simulate");
        let data = await response.json();
        return data;
    }

    function createSphere(center, radius) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(center[0] - 0.5, center[1] - 0.5, center[2] - 0.5);
        scene.add(sphere);
    }

    async function renderSimulation() {
        let simulationData = await fetchSimulation();

        simulationData.forEach(snapshot => {
            setTimeout(() => {
                scene.clear();
                snapshot.spheres.forEach(sphereData => {
                    createSphere(sphereData.center, sphereData.radius);
                });
            }, snapshot.time * 500);
        });
    }

    renderSimulation();

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
});
