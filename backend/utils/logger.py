"""
Structured logger with in-memory ring buffer for log history access.
"""
from __future__ import annotations

import logging
import sys
from collections import deque
from datetime import datetime, timezone
from threading import Lock
from typing import Deque

MAX_LOG_ENTRIES = 500


class LogEntry:
    def __init__(self, level: str, message: str, module: str):
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.level = level
        self.message = message
        self.module = module

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "level": self.level,
            "message": self.message,
            "module": self.module,
        }


class RingBufferHandler(logging.Handler):
    def __init__(self, ring: Deque[LogEntry], lock: Lock):
        super().__init__()
        self._ring = ring
        self._lock = lock

    def emit(self, record: logging.LogRecord):
        entry = LogEntry(
            level=record.levelname,
            message=record.getMessage(),
            module=record.name,
        )
        with self._lock:
            self._ring.append(entry)


_log_ring: Deque[LogEntry] = deque(maxlen=MAX_LOG_ENTRIES)
_ring_lock = Lock()

_ring_handler = RingBufferHandler(_log_ring, _ring_lock)
_ring_handler.setLevel(logging.DEBUG)

_stream_handler = logging.StreamHandler(sys.stdout)
_stream_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
)

logging.basicConfig(
    level=logging.INFO,
    handlers=[_stream_handler, _ring_handler],
)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not any(isinstance(h, RingBufferHandler) for h in logger.handlers):
        logger.addHandler(_ring_handler)
    return logger


def get_log_entries(limit: int = 200, level: str | None = None) -> list[dict]:
    with _ring_lock:
        entries = list(_log_ring)
    if level:
        entries = [e for e in entries if e.level == level.upper()]
    return [e.to_dict() for e in entries[-limit:]]
