import numpy as np
import json

# Simulation parameters
volume_total = 1.0
v = 0.01  # Sphere expansion speed
lambda0 = 100  # Base nucleation rate
alpha = 0.1  # Exponential growth exponent
dt = 0.1  # Time step
free_vol_threshold = 0.001
n_free_mc = 5000
t_max = 100.0

# Data storage
spheres = []  # List to store spheres (center, birth time)

def point_in_existing_spheres(pt, t):
    """Check if point is inside any existing sphere at time t."""
    for center, t_birth in spheres:
        r = v * (t - t_birth)
        if np.linalg.norm(pt - center) < r:
            return True
    return False

def estimate_free_volume_fraction(t):
    """Estimate fraction of free space using Monte Carlo."""
    pts = np.random.rand(n_free_mc, 3)
    free = sum(1 for pt in pts if not point_in_existing_spheres(pt, t))
    return free / n_free_mc

# Simulation loop
t = 0.0
while t < t_max:
    free_fraction = estimate_free_volume_fraction(t)
    if free_fraction < free_vol_threshold:
        break

    expected_new = lambda0 * np.exp(alpha * t) * free_fraction * volume_total * dt
    n_new = np.random.poisson(expected_new)

    new_centers = []
    for _ in range(n_new):
        candidate = np.random.rand(3)
        if not point_in_existing_spheres(candidate, t):
            new_centers.append(candidate)

    for center in new_centers:
        spheres.append((center, t))

    t += dt

# Save output as JSON for the frontend
output_data = [{"center": list(center), "radius": v * (t - t_birth)} for center, t_birth in spheres]
with open("output.json", "w") as f:
    json.dump(output_data, f)

print(f"Simulation completed with {len(spheres)} spheres.")
