from fastapi import FastAPI
from fastapi.responses import JSONResponse
import numpy as np
import math

app = FastAPI()

# ------------- PARAMETERS -------------
volume_total = 1.0
v = 0.05  
lambda0 = 100    
alpha = 0.1     
dt = 1.0
t_max = 10.0
free_vol_threshold = 0.001
n_free_mc = 1000

# ------------- SIMULATION -------------
def simulate_nucleation():
    spheres = []
    t = 0.0
    results = []

    while t < t_max:
        free_fraction = estimate_free_volume_fraction(t, spheres, n_samples=n_free_mc)
        if free_fraction < free_vol_threshold:
            break

        expected_new = lambda0 * math.exp(alpha * t) * free_fraction * volume_total * dt
        n_new = np.random.poisson(expected_new)
        
        new_centers = [np.random.rand(3).tolist() for _ in range(n_new)]
        new_centers = [c for c in new_centers if not point_in_existing_spheres(c, t, spheres)]
        spheres.extend((c, t) for c in new_centers)
        
        if int(t / dt) % 3 == 0:
            results.append({"time": t, "spheres": [{"center": c, "radius": v * (t - tb)} for c, tb in spheres]})
        
        t += dt
    
    return results

def point_in_existing_spheres(pt, t, spheres):
    for center, t_birth in spheres:
        r = v * (t - t_birth)
        if np.linalg.norm(np.array(pt) - np.array(center)) < r:
            return True
    return False

def estimate_free_volume_fraction(t, spheres, n_samples=n_free_mc):
    pts = np.random.rand(n_samples, 3)
    free = sum(not point_in_existing_spheres(pt, t, spheres) for pt in pts)
    return free / n_samples

@app.get("/simulate")
def get_simulation():
    data = simulate_nucleation()
    return JSONResponse(content=data)
