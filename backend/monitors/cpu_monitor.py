"""
CPU monitor: real metrics via psutil + simulated instruction counter.

Instruction count formula:
  estimated_instructions = cpu_percent * freq_mhz * interval_s * IPC_CONSTANT
  IPC_CONSTANT = 2.5  (typical modern desktop CPU instructions-per-cycle estimate)

This is a simulation-derived approximation documented for transparency.
"""
from __future__ import annotations

import time
import psutil
from models.metrics_schema import CoreStat, CpuSnapshot
from utils.logger import get_logger

logger = get_logger("monitors.cpu")

IPC_CONSTANT = 2.5
COLLECTION_INTERVAL_S = 1.0

_process = psutil.Process()
_start_time = time.monotonic()
_last_ctx_switches = 0


def collect() -> CpuSnapshot:
    global _last_ctx_switches

    percent_total = psutil.cpu_percent(interval=None)
    per_core_raw = psutil.cpu_percent(interval=None, percpu=True)
    per_core = [
        CoreStat(core_id=i, percent=p) for i, p in enumerate(per_core_raw)
    ]

    try:
        freq = psutil.cpu_freq(percpu=False)
        freq_mhz = freq.current if freq else 2400.0
        freq_min = freq.min if freq else 800.0
        freq_max = freq.max if freq else 4000.0
    except Exception:
        freq_mhz, freq_min, freq_max = 2400.0, 800.0, 4000.0

    cpu_times = psutil.cpu_times()
    user_time = getattr(cpu_times, "user", 0.0)
    system_time = getattr(cpu_times, "system", 0.0)
    idle_time = getattr(cpu_times, "idle", 0.0)
    iowait_time = getattr(cpu_times, "iowait", 0.0)

    estimated_instructions = int(
        (percent_total / 100.0) * freq_mhz * 1e6 * COLLECTION_INTERVAL_S * IPC_CONSTANT
    )

    execution_time_s = time.monotonic() - _start_time

    try:
        stats = psutil.cpu_stats()
        ctx_switches = stats.ctx_switches
    except Exception:
        ctx_switches = _last_ctx_switches

    delta_ctx = ctx_switches - _last_ctx_switches
    _last_ctx_switches = ctx_switches

    return CpuSnapshot(
        percent_total=round(percent_total, 2),
        percent_per_core=per_core,
        frequency_mhz=round(freq_mhz, 2),
        frequency_min_mhz=round(freq_min, 2),
        frequency_max_mhz=round(freq_max, 2),
        user_time=round(user_time, 2),
        system_time=round(system_time, 2),
        idle_time=round(idle_time, 2),
        iowait_time=round(iowait_time, 2),
        estimated_instructions=estimated_instructions,
        execution_time_s=round(execution_time_s, 2),
        context_switches=delta_ctx,
    )
