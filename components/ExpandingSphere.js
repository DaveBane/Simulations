// components/ExpandingSphere.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ExpandingSphere = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Set up scene, camera, and renderer
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Initial sphere parameters
    let radius = 1;
    const segments = 32;
    let geometry = new THREE.SphereGeometry(radius, segments, segments);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 5;

    // Animation parameters
    let growing = true;
    const maxRadius = 3;
    const minRadius = 1;
    const delta = 0.01;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update the radius for the expanding/contracting effect
      if (growing) {
        radius += delta;
        if (radius >= maxRadius) {
          growing = false;
        }
      } else {
        radius -= delta;
        if (radius <= minRadius) {
          growing = true;
        }
      }

      // Dispose of the old geometry and set a new one with the updated radius
      sphere.geometry.dispose();
      sphere.geometry = new THREE.SphereGeometry(radius, segments, segments);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resizing
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default ExpandingSphere;
