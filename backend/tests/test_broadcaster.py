import asyncio
import json

import pytest
from unittest.mock import AsyncMock, patch

import core.broadcaster as broadcaster


@pytest.fixture(autouse=True)
def reset_broadcaster():
    broadcaster._connections.clear()
    broadcaster._lock = None
    broadcaster._loop = None
    yield
    broadcaster._connections.clear()
    broadcaster._lock = None
    broadcaster._loop = None


@pytest.mark.asyncio
async def test_set_loop_stores_loop_and_creates_lock():
    loop = asyncio.get_event_loop()
    broadcaster.set_loop(loop)
    assert broadcaster._loop is loop
    assert broadcaster._lock is not None


@pytest.mark.asyncio
async def test_get_lock_raises_before_set_loop():
    with pytest.raises(RuntimeError, match="broadcaster.set_loop"):
        broadcaster._get_lock()


@pytest.mark.asyncio
async def test_register_adds_connection():
    broadcaster.set_loop(asyncio.get_event_loop())
    ws = AsyncMock()
    await broadcaster.register(ws)
    assert ws in broadcaster._connections


@pytest.mark.asyncio
async def test_register_multiple_connections():
    broadcaster.set_loop(asyncio.get_event_loop())
    ws1, ws2, ws3 = AsyncMock(), AsyncMock(), AsyncMock()
    await broadcaster.register(ws1)
    await broadcaster.register(ws2)
    await broadcaster.register(ws3)
    assert len(broadcaster._connections) == 3


@pytest.mark.asyncio
async def test_unregister_removes_connection():
    broadcaster.set_loop(asyncio.get_event_loop())
    ws = AsyncMock()
    await broadcaster.register(ws)
    await broadcaster.unregister(ws)
    assert ws not in broadcaster._connections


@pytest.mark.asyncio
async def test_unregister_nonexistent_is_noop():
    broadcaster.set_loop(asyncio.get_event_loop())
    ws = AsyncMock()
    await broadcaster.unregister(ws)  # should not raise
    assert ws not in broadcaster._connections


@pytest.mark.asyncio
async def test_broadcast_sends_json_to_all_connections():
    broadcaster.set_loop(asyncio.get_event_loop())
    ws1, ws2 = AsyncMock(), AsyncMock()
    await broadcaster.register(ws1)
    await broadcaster.register(ws2)

    payload = {"type": "metrics", "value": 42}
    await broadcaster.broadcast(payload)

    expected = json.dumps(payload)
    ws1.send_text.assert_called_once_with(expected)
    ws2.send_text.assert_called_once_with(expected)


@pytest.mark.asyncio
async def test_broadcast_removes_dead_connections():
    broadcaster.set_loop(asyncio.get_event_loop())
    dead = AsyncMock()
    dead.send_text.side_effect = Exception("connection closed")
    live = AsyncMock()
    await broadcaster.register(dead)
    await broadcaster.register(live)

    await broadcaster.broadcast({"type": "test"})

    assert dead not in broadcaster._connections
    assert live in broadcaster._connections
    live.send_text.assert_called_once()


@pytest.mark.asyncio
async def test_broadcast_noop_when_no_connections():
    broadcaster.set_loop(asyncio.get_event_loop())
    # Should not raise even with no connections
    await broadcaster.broadcast({"type": "metrics"})


def test_broadcast_sync_noop_when_loop_is_none():
    assert broadcaster._loop is None
    # Must not raise
    broadcaster.broadcast_sync({"type": "test"})


def test_broadcast_sync_noop_when_loop_not_running():
    loop = asyncio.new_event_loop()
    broadcaster._loop = loop
    broadcaster._lock = asyncio.Lock()
    # Loop is not running, so broadcast_sync should be a noop
    broadcaster.broadcast_sync({"type": "test"})
    loop.close()
