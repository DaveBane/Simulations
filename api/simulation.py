def run_simulation():
    # Temporary dummy snapshot for debugging the front end.
    # It returns one snapshot at time=0 with one sphere centered in the volume.
    return [{
        "time": 0,
        "spheres": [{
            "center": [0.5, 0.5, 0.5],
            "radius": 0.2
        }]
    }]
