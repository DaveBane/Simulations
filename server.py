from fastapi import FastAPI
from fastapi.responses import JSONResponse
from api.simulation import run_simulation
import uvicorn

app = FastAPI()

@app.get("/api/simulate")
def get_simulation():
    data = run_simulation()
    return JSONResponse(content=data)

# For local debugging:
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
