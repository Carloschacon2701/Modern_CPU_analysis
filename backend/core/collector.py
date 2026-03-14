"""
Central metrics collector: polls all monitors every INTERVAL_S seconds,
builds a MetricsSnapshot, and passes it to the broadcaster.
Also maintains a ring buffer of the last 300 snapshots.
"""
from __future__ import annotations

import asyncio
from collections import deque
from typing import Deque

from models.metrics_schema import MetricsSnapshot
from monitors import cpu_monitor, io_monitor, memory_monitor, process_monitor
from utils.logger import get_logger
from utils.time_utils import now_iso

logger = get_logger("core.collector")

INTERVAL_S = 1.0
RING_SIZE = 300

_snapshot_ring: Deque[MetricsSnapshot] = deque(maxlen=RING_SIZE)
_latest_snapshot: MetricsSnapshot | None = None

# Warm up psutil cpu_percent (first call always returns 0)
import psutil
psutil.cpu_percent(interval=None)
psutil.cpu_percent(interval=None, percpu=True)


async def collect_loop(broadcast_fn):
    global _latest_snapshot
    logger.info(f"Metrics collection loop started (interval={INTERVAL_S}s)")

    while True:
        try:
            snapshot = MetricsSnapshot(
                timestamp=now_iso(),
                cpu=cpu_monitor.collect(),
                memory=memory_monitor.collect(),
                io=io_monitor.collect(),
                processes=process_monitor.collect(),
            )
            _snapshot_ring.append(snapshot)
            _latest_snapshot = snapshot
            await broadcast_fn(snapshot.model_dump())
        except Exception as exc:
            logger.error(f"Collection error: {exc}")

        await asyncio.sleep(INTERVAL_S)


def get_latest() -> MetricsSnapshot | None:
    return _latest_snapshot


def get_history() -> list[MetricsSnapshot]:
    return list(_snapshot_ring)
