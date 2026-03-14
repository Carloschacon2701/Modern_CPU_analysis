"""
Memory monitor: real metrics via psutil + simulated latency model + ops counters.

Latency model (simulated DRAM pressure curve):
  0–60%  → 80 ns  (low pressure)
  60–80% → 120 ns (moderate pressure)
  80–95% → 200 ns (high pressure)
  95%+   → 400 ns (severe pressure, page-fault territory)

Read/write ops counters are fed by the simulation workloads via thread-safe counters.
"""
from __future__ import annotations

import threading
import psutil
from models.metrics_schema import MemorySnapshot
from utils.logger import get_logger

logger = get_logger("monitors.memory")

_read_counter = 0
_write_counter = 0
_counter_lock = threading.Lock()
_last_read = 0
_last_write = 0

LATENCY_CURVE = [
    (60.0, 80.0),
    (80.0, 120.0),
    (95.0, 200.0),
    (101.0, 400.0),
]


def increment_read_ops(count: int = 1):
    global _read_counter
    with _counter_lock:
        _read_counter += count


def increment_write_ops(count: int = 1):
    global _write_counter
    with _counter_lock:
        _write_counter += count


def _simulated_latency(percent: float) -> float:
    for threshold, latency in LATENCY_CURVE:
        if percent < threshold:
            return latency
    return 400.0


def collect() -> MemorySnapshot:
    global _last_read, _last_write

    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()

    with _counter_lock:
        current_read = _read_counter
        current_write = _write_counter

    read_ops = current_read - _last_read
    write_ops = current_write - _last_write
    _last_read = current_read
    _last_write = current_write

    latency = _simulated_latency(vm.percent)

    return MemorySnapshot(
        total_bytes=vm.total,
        available_bytes=vm.available,
        used_bytes=vm.used,
        percent=round(vm.percent, 2),
        buffers_bytes=getattr(vm, "buffers", 0),
        cached_bytes=getattr(vm, "cached", 0),
        swap_total_bytes=swap.total,
        swap_used_bytes=swap.used,
        swap_percent=round(swap.percent, 2),
        read_ops_per_sec=float(read_ops),
        write_ops_per_sec=float(write_ops),
        simulated_latency_ns=latency,
    )
