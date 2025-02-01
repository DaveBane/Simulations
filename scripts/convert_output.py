import json

def convert_to_json():
    with open("output.json", "r") as f:
        data = json.load(f)
    with open("../public/simulation_data.json", "w") as f:
        json.dump(data, f)

convert_to_json()
