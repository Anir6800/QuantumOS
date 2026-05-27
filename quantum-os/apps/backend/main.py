from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from core.exceptions import QuantumOSException, global_exception_handler
from core.middleware import RequestLoggingMiddleware
from routers import sessions, agents, ws, logs, providers

app = FastAPI(
    title="QuantumOS Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)
app.add_exception_handler(QuantumOSException, global_exception_handler)

app.include_router(sessions.router)
app.include_router(agents.router)
app.include_router(ws.router)
app.include_router(logs.router)
app.include_router(providers.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "quantum-os-backend"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
