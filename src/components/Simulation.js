import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';

const Simulation = () => {
  const [spheres, setSpheres] = useState([]);

  useEffect(() => {
    fetch('/api/runSimulation')
      .then(response => response.json())
      .then(data => setSpheres(data));
  }, []);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {spheres.map((sphere, index) => (
        <Sphere key={index} args={[sphere.radius, 32, 32]} position={sphere.center} />
      ))}
    </Canvas>
  );
};

export default Simulation;
