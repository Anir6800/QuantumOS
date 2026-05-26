from fastapi import FastAPI
import uvicorn

app = FastAPI(
    title="QuantumOS Backend",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "quantum-os-backend"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
