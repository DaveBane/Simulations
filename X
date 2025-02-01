import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import math
import time

# ------------- PARAMETERS -------------
volume_total = 1.0

# Increase the expansion speed from 0.01 to 0.05
v = 0.05  

# Nucleation parameters:
lambda0 = 100    # base nucleation rate (per unit volume, per unit time)
alpha = 0.1      # exponential growth exponent for nucleation rate

# Time step and simulation duration (adjusted for visualization)
dt = 1.0
t_max = 10.0

free_vol_threshold = 0.001

# For free volume estimation, use a Monte Carlo sample of points (reduced for speed)
n_free_mc = 1000

# ------------- DATA STRUCTURES -------------
# Each sphere is represented as a tuple: (center, t_birth)
spheres = []  # list to store spheres

# ------------- HELPER FUNCTIONS -------------
def point_in_existing_spheres(pt, t, spheres):
    """
    Check if the point pt (3d numpy array) lies within any sphere at time t.
    Each sphere i has radius r_i = v * (t - t_birth).
    """
    for center, t_birth in spheres:
        r = v * (t - t_birth)
        if np.linalg.norm(pt - center) < r:
            return True
    return False

def estimate_free_volume_fraction(t, spheres, n_samples=n_free_mc):
    """
    Estimate fraction of free space by Monte Carlo sampling in the unit cube.
    """
    pts = np.random.rand(n_samples, 3)
    free = sum(not point_in_existing_spheres(pt, t, spheres) for pt in pts)
    return free / n_samples

# ------------- SIMULATION LOOP -------------
t = 0.0
snapshots = []  # Store snapshots for visualization

while t < t_max:
    free_fraction = estimate_free_volume_fraction(t, spheres, n_samples=n_free_mc)
    if free_fraction < free_vol_threshold:
        break

    # Expected number of new nucleation events based on free volume.
    expected_new = lambda0 * math.exp(alpha * t) * free_fraction * volume_total * dt
    n_new = np.random.poisson(expected_new)
    
    # Generate candidate centers and only accept those not inside an existing sphere.
    new_centers = [np.random.rand(3) for _ in range(n_new)]
    new_centers = [c for c in new_centers if not point_in_existing_spheres(c, t, spheres)]
    spheres.extend((c, t) for c in new_centers)
    
    # Capture a snapshot every few time steps for visualization.
    if int(t / dt) % 3 == 0:
        snapshots.append((t, list(spheres)))
    
    t += dt

# ------------- VISUALIZATION -------------
def plot_snapshot(time, spheres):
    fig = plt.figure(figsize=(6, 6))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_title(f"t = {time:.2f}")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_zlim(0, 1)
    
    # Plot each sphere.
    for center, t_birth in spheres:
        radius = v * (time - t_birth)
        u, v_angles = np.mgrid[0:2*np.pi:10j, 0:np.pi:10j]
        x = center[0] + radius * np.cos(u) * np.sin(v_angles)
        y = center[1] + radius * np.sin(u) * np.sin(v_angles)
        z = center[2] + radius * np.cos(v_angles)
        ax.plot_surface(x, y, z, color='b', alpha=0.3, linewidth=0)
    
    return fig

# Generate and display snapshots.
figures = [plot_snapshot(time, spheres) for time, spheres in snapshots]
plt.show()
