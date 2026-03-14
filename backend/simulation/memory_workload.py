"""
Memory workloads: sequential and random array access patterns.
Increments the memory monitor's ops counters to drive read/write metrics.
"""
from __future__ import annotations

import random
import time
from typing import Callable

import psutil

from monitors import memory_monitor
from utils.logger import get_logger

logger = get_logger("simulation.memory")

MB = 1024 * 1024


def run_sequential(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    size_mb = 50 * intensity
    size_bytes = size_mb * MB
    logger.info(f"Memory sequential starting: size={size_mb}MB, duration={duration_s}s")
    emit("started", {"algorithm": "memory_sequential", "size_mb": size_mb})

    buf = bytearray(size_bytes)
    start = time.monotonic()
    iterations = 0
    process = psutil.Process()

    while time.monotonic() - start < duration_s:
        # Sequential write
        for i in range(0, size_bytes, 4096):
            buf[i] = (iterations + i) & 0xFF
            memory_monitor.increment_write_ops(1)

        # Sequential read
        checksum = 0
        for i in range(0, size_bytes, 4096):
            checksum += buf[i]
            memory_monitor.increment_read_ops(1)

        iterations += 1
        rss_mb = process.memory_info().rss / MB
        elapsed = round(time.monotonic() - start, 2)
        emit(
            "progress",
            {
                "iteration": iterations,
                "size_mb": size_mb,
                "rss_mb": round(rss_mb, 2),
                "checksum": checksum & 0xFFFF,
                "elapsed_s": elapsed,
            },
        )

    del buf
    emit("completed", {"iterations": iterations, "elapsed_s": round(time.monotonic() - start, 2)})
    logger.info(f"Memory sequential completed: {iterations} iterations")


def run_random(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    size_mb = 30 * intensity
    size_bytes = size_mb * MB
    logger.info(f"Memory random starting: size={size_mb}MB, duration={duration_s}s")
    emit("started", {"algorithm": "memory_random", "size_mb": size_mb})

    buf = bytearray(size_bytes)
    indices = random.sample(range(0, size_bytes, 64), min(50_000, size_bytes // 64))
    start = time.monotonic()
    iterations = 0
    process = psutil.Process()

    while time.monotonic() - start < duration_s:
        random.shuffle(indices)
        for idx in indices:
            buf[idx] = (buf[idx] + 1) & 0xFF
            memory_monitor.increment_read_ops(1)
            memory_monitor.increment_write_ops(1)

        iterations += 1
        rss_mb = process.memory_info().rss / MB
        elapsed = round(time.monotonic() - start, 2)
        emit(
            "progress",
            {
                "iteration": iterations,
                "size_mb": size_mb,
                "random_accesses": len(indices),
                "rss_mb": round(rss_mb, 2),
                "elapsed_s": elapsed,
            },
        )

    del buf
    emit("completed", {"iterations": iterations, "elapsed_s": round(time.monotonic() - start, 2)})
    logger.info(f"Memory random completed: {iterations} iterations")
