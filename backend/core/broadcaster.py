"""
WebSocket broadcaster: fan-out JSON messages to all active connections.
Uses asyncio.gather with return_exceptions=True to prevent stale sockets
from crashing the broadcast loop.
"""
from __future__ import annotations

import asyncio
import json
from fastapi import WebSocket
from utils.logger import get_logger

logger = get_logger("core.broadcaster")

_connections: set[WebSocket] = set()
_lock = asyncio.Lock()


async def register(ws: WebSocket):
    async with _lock:
        _connections.add(ws)
    logger.info(f"WebSocket registered. Active connections: {len(_connections)}")


async def unregister(ws: WebSocket):
    async with _lock:
        _connections.discard(ws)
    logger.info(f"WebSocket unregistered. Active connections: {len(_connections)}")


async def broadcast(payload: dict):
    if not _connections:
        return
    message = json.dumps(payload)
    async with _lock:
        targets = list(_connections)

    results = await asyncio.gather(
        *[ws.send_text(message) for ws in targets],
        return_exceptions=True,
    )

    # Clean up dead connections
    dead = []
    for ws, result in zip(targets, results):
        if isinstance(result, Exception):
            dead.append(ws)
            logger.warning(f"Dead WebSocket removed: {type(result).__name__}")

    if dead:
        async with _lock:
            for ws in dead:
                _connections.discard(ws)


def broadcast_sync(payload: dict):
    """Thread-safe bridge for calling broadcast from non-async simulation threads."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(broadcast(payload), loop)
    except RuntimeError:
        pass
