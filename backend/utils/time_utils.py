"""
Monotonic clock helpers and ISO timestamp generation.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def monotonic_ms() -> float:
    return time.monotonic() * 1000


def elapsed_seconds(start_monotonic: float) -> float:
    return time.monotonic() - start_monotonic
