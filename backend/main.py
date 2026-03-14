"""
CPU Analyzer — FastAPI backend entry point.

Endpoints:
  GET  /api/metrics/snapshot     — Latest metrics snapshot
  GET  /api/metrics/history      — Historical metrics
  POST /api/simulation/start     — Start a workload simulation
  POST /api/simulation/stop/{id} — Stop a running simulation
  GET  /api/simulation/status/{id}
  GET  /api/simulation/runs
  GET  /api/simulation/workloads
  GET  /api/logs                 — Execution log ring buffer
  WS   /ws/metrics               — Real-time metrics + simulation events
"""
from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.routes_logs import router as logs_router
from api.routes_metrics import router as metrics_router
from api.routes_simulation import router as simulation_router
from core import broadcaster
from core.scheduler import lifespan
from utils.logger import get_logger

logger = get_logger("main")

app = FastAPI(
    title="CPU Analyzer",
    description="Real-time CPU / Memory / I/O analysis platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics_router)
app.include_router(simulation_router)
app.include_router(logs_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/metrics")
async def metrics_ws(ws: WebSocket):
    await ws.accept()
    await broadcaster.register(ws)
    logger.info(f"WebSocket client connected: {ws.client}")
    try:
        while True:
            # Keep connection alive; client sends pings
            await ws.receive_text()
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {ws.client}")
    except Exception as exc:
        logger.warning(f"WebSocket error: {exc}")
    finally:
        await broadcaster.unregister(ws)
