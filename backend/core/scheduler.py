"""
asyncio task scheduler: starts the collection loop as a background task
inside FastAPI's lifespan context manager.
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from core import broadcaster, collector
from simulation import workload_runner
from utils.logger import get_logger

logger = get_logger("core.scheduler")

_collection_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(_app):
    global _collection_task
    logger.info("Starting CPU Analyzer backend...")

    # Capture the running loop so broadcast_sync() can use it from worker threads.
    broadcaster.set_loop(asyncio.get_event_loop())

    # Wire simulation events → WebSocket broadcaster
    workload_runner.set_broadcast_callback(broadcaster.broadcast_sync)

    # Start background metrics collection
    _collection_task = asyncio.create_task(
        collector.collect_loop(broadcaster.broadcast)
    )
    logger.info("Metrics collection task created.")

    yield

    logger.info("Shutting down CPU Analyzer backend...")
    if _collection_task:
        _collection_task.cancel()
        try:
            await _collection_task
        except asyncio.CancelledError:
            pass
    logger.info("Shutdown complete.")
