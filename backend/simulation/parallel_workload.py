"""
Parallel workload: splits the prime sieve across multiple threads to drive
per-core CPU utilization. Uses ThreadPoolExecutor for visibility on the
process/thread monitor panel.
"""
from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable

from simulation.cpu_workload import sieve_of_eratosthenes
from simulation.hardware_profiles import HardwareProfile, PROFILES
from utils.logger import get_logger

logger = get_logger("simulation.parallel")


def _worker_sieve(chunk_id: int, start: int, end: int) -> tuple[int, int]:
    """Count primes in [start, end] using the full sieve then filtering."""
    if end <= start:
        return chunk_id, 0
    all_primes = sieve_of_eratosthenes(end)
    count = sum(1 for p in all_primes if p >= start)
    return chunk_id, count


def run_parallel(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
    profile: HardwareProfile = None,
):
    profile = profile or PROFILES["real_machine"]
    # For simulated hardware, cap workers to the profile's core count
    real_cores = os.cpu_count() or 4
    profile_cores = profile.cpu_cores if profile.cpu_cores > 0 else real_cores
    num_workers = min(real_cores, profile_cores, 4 + intensity // 3)
    limit = 50_000 * intensity
    chunk_size = limit // num_workers

    logger.info(
        f"Parallel workload starting: workers={num_workers}, limit={limit}, duration={duration_s}s, profile={profile.id}"
    )
    emit(
        "started",
        {
            "algorithm": "parallel_sieve",
            "workers": num_workers,
            "limit": limit,
            "hardware_profile": profile.id,
        },
    )

    wall_start = time.monotonic()
    iterations = 0

    while time.monotonic() - wall_start < duration_s:
        iter_start = time.monotonic()
        chunks = [
            (i, i * chunk_size, min((i + 1) * chunk_size, limit))
            for i in range(num_workers)
        ]
        total_primes = 0
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = {
                executor.submit(_worker_sieve, cid, s, e): cid
                for cid, s, e in chunks
            }
            for future in as_completed(futures):
                chunk_id, count = future.result()
                total_primes += count

        iter_elapsed = time.monotonic() - iter_start
        profile.throttle(iter_elapsed)
        iterations += 1
        elapsed = round(time.monotonic() - wall_start, 2)
        emit(
            "progress",
            {
                "iteration": iterations,
                "workers": num_workers,
                "primes_found": total_primes,
                "iter_duration_s": round(iter_elapsed, 3),
                "elapsed_s": elapsed,
            },
        )

    emit(
        "completed",
        {"iterations": iterations, "elapsed_s": round(time.monotonic() - wall_start, 2)},
    )
    logger.info(f"Parallel workload completed: {iterations} iterations, {num_workers} workers")
