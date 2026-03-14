"""
REST endpoint: GET /api/logs
Returns the in-memory log ring buffer with optional level filter.
"""
from typing import Optional

from fastapi import APIRouter
from utils.logger import get_log_entries

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
async def get_logs(limit: int = 200, level: Optional[str] = None):
    entries = get_log_entries(limit=limit, level=level)
    return {"count": len(entries), "entries": entries}
