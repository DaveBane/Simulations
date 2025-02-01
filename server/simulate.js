export function runSimulation() {
  const volumeTotal = 1.0;
  const v = 0.01; // Sphere expansion speed
  const lambda0 = 100; // Base nucleation rate
  const alpha = 0.1; // Exponential growth exponent
  const dt = 0.1; // Time step
  const freeVolThreshold = 0.001;
  const nFreeMc = 5000;
  const tMax = 100.0;

  let spheres = [];
  let t = 0.0;

  function pointInExistingSpheres(pt, t) {
    return spheres.some(([center, tBirth]) => {
      const r = v * (t - tBirth);
      return Math.hypot(...center.map((c, i) => c - pt[i])) < r;
    });
  }

  function estimateFreeVolumeFraction(t) {
    let freeCount = 0;
    for (let i = 0; i < nFreeMc; i++) {
      const pt = [Math.random(), Math.random(), Math.random()];
      if (!pointInExistingSpheres(pt, t)) {
        freeCount++;
      }
    }
    return freeCount / nFreeMc;
  }

  while (t < tMax) {
    const freeFraction = estimateFreeVolumeFraction(t);
    if (freeFraction < freeVolThreshold) break;

    const expectedNew = lambda0 * Math.exp(alpha * t) * freeFraction * volumeTotal * dt;
    const nNew = Math.floor(expectedNew + Math.random());

    let newCenters = [];
    for (let i = 0; i < nNew; i++) {
      const candidate = [Math.random(), Math.random(), Math.random()];
      if (!pointInExistingSpheres(candidate, t)) {
        newCenters.push(candidate);
      }
    }

    spheres.push(...newCenters.map((center) => [center, t]));
    t += dt;
  }

  return spheres.map(([center, tBirth]) => ({
    center,
    radius: v * (t - tBirth),
  }));
}
