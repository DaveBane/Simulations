initThree() {
    // Scene with background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 5000);
    this.camera.position.set(0, 0, config.WORLD_SIZE * 0.7);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    console.log('Three.js initialized'); // Debug log
}
