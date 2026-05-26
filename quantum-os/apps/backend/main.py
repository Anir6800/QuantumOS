from fastapi import FastAPI
import uvicorn

from core.exceptions import QuantumOSException, global_exception_handler
from core.middleware import RequestLoggingMiddleware
from routers import sessions, agents, ws, logs

app = FastAPI(
    title="QuantumOS Backend",
    version="1.0.0"
)

app.add_middleware(RequestLoggingMiddleware)
app.add_exception_handler(QuantumOSException, global_exception_handler)

app.include_router(sessions.router)
app.include_router(agents.router)
app.include_router(ws.router)
app.include_router(logs.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "quantum-os-backend"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
