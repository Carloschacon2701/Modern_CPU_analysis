"""
WebSocket broadcaster: fan-out JSON messages to all active connections.

broadcast_sync() is called from ThreadPoolExecutor worker threads.
It needs the main event loop — which is captured once at startup via set_loop()
and stored here. asyncio.get_event_loop() from a worker thread does NOT return
the main loop in Python 3.9+, so we must capture it explicitly.
"""
from __future__ import annotations

import asyncio
import json
from typing import Optional

from fastapi import WebSocket
from utils.logger import get_logger

logger = get_logger("core.broadcaster")

_connections: set[WebSocket] = set()
# Lazy lock — created inside the running event loop, not at import time.
_lock: Optional[asyncio.Lock] = None
# Main event loop reference, set once during lifespan startup.
_loop: Optional[asyncio.AbstractEventLoop] = None


def set_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Called once from the lifespan coroutine to capture the running loop."""
    global _loop, _lock
    _loop = loop
    _lock = asyncio.Lock()
    logger.info("Broadcaster event loop registered.")


def _get_lock() -> asyncio.Lock:
    if _lock is None:
        raise RuntimeError("broadcaster.set_loop() was never called")
    return _lock


async def register(ws: WebSocket) -> None:
    async with _get_lock():
        _connections.add(ws)
    logger.info(f"WebSocket registered. Active connections: {len(_connections)}")


async def unregister(ws: WebSocket) -> None:
    async with _get_lock():
        _connections.discard(ws)
    logger.info(f"WebSocket unregistered. Active connections: {len(_connections)}")


async def broadcast(payload: dict) -> None:
    if not _connections:
        return
    message = json.dumps(payload)
    async with _get_lock():
        targets = list(_connections)

    results = await asyncio.gather(
        *[ws.send_text(message) for ws in targets],
        return_exceptions=True,
    )

    dead = [ws for ws, r in zip(targets, results) if isinstance(r, Exception)]
    if dead:
        async with _get_lock():
            for ws in dead:
                _connections.discard(ws)
        logger.warning(f"Removed {len(dead)} dead WebSocket connection(s).")


def broadcast_sync(payload: dict) -> None:
    """
    Thread-safe bridge for calling broadcast() from non-async threads
    (e.g. ThreadPoolExecutor simulation workers).

    Uses asyncio.run_coroutine_threadsafe with the explicitly stored loop —
    NOT asyncio.get_event_loop(), which returns the wrong loop from worker threads.
    """
    if _loop is None or not _loop.is_running():
        logger.warning("broadcast_sync called before loop was set or loop stopped.")
        return
    asyncio.run_coroutine_threadsafe(broadcast(payload), _loop)
