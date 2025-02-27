// Vertex Shader: Passes the normal (surface direction) to the fragment shader
const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader: Colors the sphere based on its normals
const fragmentShader = `
  varying vec3 vNormal;
  void main() {
    vec3 color = vec3(0.5 + 0.5 * vNormal); // Gradient from dark to light
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Apply the shader to the sphere
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});
const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
scene.add(sphere);
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
