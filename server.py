from fastapi import FastAPI
from fastapi.responses import JSONResponse
from api.simulation import run_simulation

app = FastAPI()

@app.get("/simulate")
def get_simulation():
    data = run_simulation()
    return JSONResponse(content=data)
