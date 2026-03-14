"""
REST endpoint: GET /api/metrics/snapshot
Returns the most recent metrics snapshot (used on initial page load).
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from core.collector import get_latest, get_history

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/snapshot")
async def get_snapshot():
    snapshot = get_latest()
    if snapshot is None:
        raise HTTPException(status_code=503, detail="No snapshot available yet")
    return snapshot.model_dump()


@router.get("/history")
async def get_history_endpoint(limit: int = 60):
    history = get_history()
    limited = history[-min(limit, 300):]
    return [s.model_dump() for s in limited]
