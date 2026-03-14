"""
Process monitor: active processes with thread details via psutil.
Top 20 by CPU usage; thread detail for top 5.
"""
from __future__ import annotations

import psutil
from models.metrics_schema import ProcessEntry, ThreadInfo
from utils.logger import get_logger

logger = get_logger("monitors.process")

MAX_PROCESSES = 20
THREAD_DETAIL_COUNT = 5


def collect() -> list[ProcessEntry]:
    entries: list[ProcessEntry] = []
    procs = []

    for proc in psutil.process_iter(
        ["pid", "name", "cpu_percent", "memory_percent", "num_threads", "nice", "status"]
    ):
        try:
            info = proc.info
            procs.append(info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    procs.sort(key=lambda p: p.get("cpu_percent") or 0.0, reverse=True)
    top_procs = procs[:MAX_PROCESSES]

    for i, info in enumerate(top_procs):
        threads = []
        if i < THREAD_DETAIL_COUNT:
            try:
                p = psutil.Process(info["pid"])
                for t in p.threads()[:10]:
                    threads.append(
                        ThreadInfo(
                            thread_id=t.id,
                            user_time=round(t.user_time, 4),
                            system_time=round(t.system_time, 4),
                        )
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        entries.append(
            ProcessEntry(
                pid=info.get("pid", 0),
                name=info.get("name", "unknown") or "unknown",
                status=info.get("status", "unknown") or "unknown",
                cpu_percent=round(info.get("cpu_percent") or 0.0, 2),
                memory_percent=round(info.get("memory_percent") or 0.0, 4),
                num_threads=info.get("num_threads") or 0,
                priority=info.get("nice") or 0,
                threads=threads,
            )
        )

    return entries
