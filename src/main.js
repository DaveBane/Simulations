import numpy as np
from scipy.spatial import KDTree
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

class Sphere:
    def __init__(self, x, y, z, t0):
        self.x = x
        self.y = y
        self.z = z
        self.t0 = t0
        self.radius = 0.0

# Simulation parameters
L = 10.0         # Size of the cubic space
v = 0.2          # Expansion speed of spheres
lambda0 = 0.01   # Initial nucleation rate (per unit volume)
k = 0.5          # Exponential growth rate
dt = 0.1         # Time step
max_time = 20.0  # Maximum simulation time
min_coverage = 0.99  # Stop when 99% of space is covered

# Initialize simulation
spheres = []
t = 0.0
coverage_history = []

# Store frames for animation (stores every nth frame)
frames = []
frame_interval = 5  # Store every 5th frame

# Monte Carlo sampling parameters
mc_samples = 1000

def calculate_coverage():
    hits = 0
    for _ in range(mc_samples):
        x, y, z = np.random.uniform(0, L, 3)
        for s in spheres:
            dx = x - s.x
            dy = y - s.y
            dz = z - s.z
            if np.sqrt(dx**2 + dy**2 + dz**2) <= s.radius:
                hits += 1
                break
    return hits / mc_samples

# Main simulation loop
while t <= max_time:
    # Update sphere radii
    for s in spheres:
        s.radius = v * (t - s.t0)
    
    # Calculate current coverage
    coverage = calculate_coverage()
    coverage_history.append(coverage)
    
    # Check termination condition
    if coverage >= min_coverage:
        print(f"Terminating at t={t:.1f} with {coverage*100:.1f}% coverage")
        break
    
    # Calculate current nucleation rate
    current_lambda = lambda0 * np.exp(k * t)
    
    # Calculate available volume
    available_volume = (1 - coverage) * L**3
    
    # Calculate expected number of new spheres
    N_new = current_lambda * available_volume * dt
    num_new = np.random.poisson(N_new)
    
    # Generate new spheres
    if num_new > 0:
        # Create list of existing centers
        existing_centers = np.array([[s.x, s.y, s.z] for s in spheres]) if spheres else np.empty((0, 3))
        kd_tree = KDTree(existing_centers) if len(existing_centers) > 0 else None
        current_max_radius = v * t
        
        new_spheres = []
        for _ in range(num_new):
            valid = False
            attempts = 0
            while not valid and attempts < 1000:
                pos = np.random.uniform(0, L, 3)
                if kd_tree is None:
                    valid = True
                else:
                    # Find all existing spheres within possible collision distance
                    indices = kd_tree.query_ball_point(pos, current_max_radius)
                    collision = False
                    for i in indices:
                        s = spheres[i]
                        dx = pos[0] - s.x
                        dy = pos[1] - s.y
                        dz = pos[2] - s.z
                        if np.sqrt(dx**2 + dy**2 + dz**2) <= s.radius:
                            collision = True
                            break
                    valid = not collision
                attempts += 1
            if valid:
                new_spheres.append(Sphere(pos[0], pos[1], pos[2], t))
        
        spheres.extend(new_spheres)
    
    # Store frame for animation
    if len(frames) % frame_interval == 0:
        frames.append((t, np.array([[s.x, s.y, s.z] for s in spheres]), 
                      np.array([s.radius for s in spheres])))
    
    t += dt

# Create animation
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')
ax.set_xlim(0, L)
ax.set_ylim(0, L)
ax.set_zlim(0, L)
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')
title = ax.set_title(f'Time: 0.0s')

# Scaling factor for sphere visualization
scale_factor = 20  # Adjust this based on your viewing preferences

def update(frame):
    t, centers, radii = frame
    ax.clear()
    ax.set_xlim(0, L)
    ax.set_ylim(0, L)
    ax.set_zlim(0, L)
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.set_title(f'Time: {t:.1f}s, Spheres: {len(centers)}')
    
    if len(centers) > 0:
        # Scale radii for visualization (marker size is area in points)
        sizes = (radii * scale_factor)**2
        ax.scatter(centers[:,0], centers[:,1], centers[:,2], 
                  s=sizes, alpha=0.4, edgecolors='none')
    
    return ax,

# Create animation with limited frames to keep file size manageable
ani = FuncAnimation(fig, update, frames=frames[::2], interval=50, blit=False)

plt.show()

# Optional: Save to file (requires ffmpeg)
# ani.save('sphere_expansion.mp4', writer='ffmpeg', fps=15)
