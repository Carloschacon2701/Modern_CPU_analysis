"""
Workload runner: orchestrates all simulation workloads.

Each workload runs in a ThreadPoolExecutor thread.
A WorkloadImpactRecorder daemon-thread samples CPU / memory / disk / net /
thread-count every 500 ms for the duration of the run and stores the
time-series in _impact_data[run_id] for later retrieval.
"""
from __future__ import annotations

import threading
import time
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Callable, Optional

import psutil

from models.simulation_schema import SimulationEvent, SimulationStatus
from utils.logger import get_logger
from utils.time_utils import now_iso

logger = get_logger("simulation.runner")

_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="workload")
_active_runs: dict[str, dict] = {}
_impact_data: dict[str, list[dict]] = {}   # run_id → sampled metric rows
_run_lock = threading.Lock()
_broadcast_cb: Optional[Callable[[dict], None]] = None

IMPACT_INTERVAL_S = 0.5  # sample every 500 ms


# ── Impact recorder ───────────────────────────────────────────────────────────

class WorkloadImpactRecorder:
    """
    Runs as a daemon thread alongside the workload.
    Captures: timestamp, elapsed_s, cpu_percent, memory_percent,
              disk_read_bps, disk_write_bps, net_sent_bps, net_recv_bps,
              total_thread_count.
    """

    def __init__(self, run_id: str, samples: list[dict]):
        self._run_id = run_id
        self._samples = samples
        self._stop = threading.Event()
        self._thread = threading.Thread(
            target=self._record, daemon=True, name=f"impact-{run_id[:8]}"
        )
        self._start_mono = time.monotonic()
        # Baseline disk / net counters
        try:
            self._prev_disk = psutil.disk_io_counters()
        except Exception:
            self._prev_disk = None
        try:
            self._prev_net = psutil.net_io_counters()
        except Exception:
            self._prev_net = None
        self._prev_time = time.monotonic()

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop.set()
        self._thread.join(timeout=3)

    def _record(self):
        while not self._stop.wait(IMPACT_INTERVAL_S):
            now = time.monotonic()
            elapsed = max(now - self._prev_time, 0.001)

            # Disk delta
            read_bps = write_bps = 0.0
            try:
                disk = psutil.disk_io_counters()
                if disk and self._prev_disk:
                    read_bps = max(0.0, (disk.read_bytes - self._prev_disk.read_bytes) / elapsed)
                    write_bps = max(0.0, (disk.write_bytes - self._prev_disk.write_bytes) / elapsed)
                self._prev_disk = disk
            except Exception:
                pass

            # Net delta
            sent_bps = recv_bps = 0.0
            try:
                net = psutil.net_io_counters()
                if net and self._prev_net:
                    sent_bps = max(0.0, (net.bytes_sent - self._prev_net.bytes_sent) / elapsed)
                    recv_bps = max(0.0, (net.bytes_recv - self._prev_net.bytes_recv) / elapsed)
                self._prev_net = net
            except Exception:
                pass

            # Total thread count across all processes
            total_threads = 0
            try:
                for proc in psutil.process_iter(["num_threads"]):
                    total_threads += proc.info.get("num_threads") or 0
            except Exception:
                pass

            self._prev_time = now

            self._samples.append({
                "timestamp": now_iso(),
                "elapsed_s": round(now - self._start_mono, 2),
                "cpu_percent": round(psutil.cpu_percent(interval=None), 2),
                "memory_percent": round(psutil.virtual_memory().percent, 2),
                "disk_read_bps": round(read_bps, 2),
                "disk_write_bps": round(write_bps, 2),
                "net_sent_bps": round(sent_bps, 2),
                "net_recv_bps": round(recv_bps, 2),
                "total_thread_count": total_threads,
            })


# ── Internal helpers ──────────────────────────────────────────────────────────

def set_broadcast_callback(cb: Callable[[dict], None]):
    global _broadcast_cb
    _broadcast_cb = cb


def _emit(run_id: str, workload: str, event: str, payload: dict[str, Any]):
    evt = SimulationEvent(
        run_id=run_id,
        workload=workload,
        event=event,
        payload=payload,
        timestamp=now_iso(),
    )
    if _broadcast_cb:
        _broadcast_cb(evt.model_dump())
    logger.info(f"[{workload}][{event}] {payload}")


def _run_workload(run_id: str, request_dict: dict):
    workload_type = request_dict["workload_type"]
    intensity = request_dict["intensity"]
    duration_s = float(request_dict["duration_seconds"])

    emit = lambda event, payload: _emit(run_id, workload_type, event, payload)

    # Start impact recorder
    samples: list[dict] = []
    with _run_lock:
        _impact_data[run_id] = samples
    recorder = WorkloadImpactRecorder(run_id, samples)
    recorder.start()

    try:
        if workload_type == "cpu_prime":
            from simulation.cpu_workload import run_prime_sieve
            run_prime_sieve(intensity, duration_s, emit)
        elif workload_type == "cpu_fibonacci":
            from simulation.cpu_workload import run_fibonacci
            run_fibonacci(intensity, duration_s, emit)
        elif workload_type == "cpu_sort":
            from simulation.cpu_workload import run_sort
            run_sort(intensity, duration_s, emit)
        elif workload_type == "memory_sequential":
            from simulation.memory_workload import run_sequential
            run_sequential(intensity, duration_s, emit)
        elif workload_type == "memory_random":
            from simulation.memory_workload import run_random
            run_random(intensity, duration_s, emit)
        elif workload_type == "parallel":
            from simulation.parallel_workload import run_parallel
            run_parallel(intensity, duration_s, emit)
        elif workload_type == "ai_matrix":
            from simulation.ai_workload import run_matrix_multiply
            run_matrix_multiply(intensity, duration_s, emit)
        elif workload_type == "ai_kmeans":
            from simulation.ai_workload import run_kmeans
            run_kmeans(intensity, duration_s, emit)
        elif workload_type == "ai_nn":
            from simulation.ai_workload import run_neural_network
            run_neural_network(intensity, duration_s, emit)
        else:
            emit("error", {"message": f"Unknown workload type: {workload_type}"})
            return

        with _run_lock:
            if run_id in _active_runs:
                _active_runs[run_id]["status"] = "completed"
                _active_runs[run_id]["ended_at"] = now_iso()

    except Exception as exc:
        logger.error(f"Workload {workload_type} failed: {exc}", exc_info=True)
        emit("error", {"message": str(exc)})
        with _run_lock:
            if run_id in _active_runs:
                _active_runs[run_id]["status"] = "error"
                _active_runs[run_id]["ended_at"] = now_iso()
    finally:
        recorder.stop()
        logger.info(
            f"Impact recorder stopped for {run_id[:8]}. "
            f"Captured {len(samples)} samples."
        )


# ── Public API ────────────────────────────────────────────────────────────────

def start_workload(request_dict: dict) -> str:
    run_id = str(uuid.uuid4())
    started_at = now_iso()

    run_info = {
        "run_id": run_id,
        "workload_type": request_dict["workload_type"],
        "status": "running",
        "intensity": request_dict["intensity"],
        "duration_seconds": request_dict["duration_seconds"],
        "started_at": started_at,
        "ended_at": None,
    }

    with _run_lock:
        _active_runs[run_id] = run_info

    future: Future = _executor.submit(_run_workload, run_id, request_dict)

    with _run_lock:
        _active_runs[run_id]["_future"] = future

    logger.info(f"Started workload {request_dict['workload_type']} run_id={run_id}")
    return run_id


def stop_workload(run_id: str) -> bool:
    with _run_lock:
        run = _active_runs.get(run_id)
    if not run:
        return False

    future: Optional[Future] = run.get("_future")
    if future:
        future.cancel()

    with _run_lock:
        if run_id in _active_runs:
            _active_runs[run_id]["status"] = "stopped"
            _active_runs[run_id]["ended_at"] = now_iso()

    logger.info(f"Stopped workload run_id={run_id}")
    return True


def get_status(run_id: str) -> Optional[SimulationStatus]:
    with _run_lock:
        run = _active_runs.get(run_id)
    if not run:
        return None
    return SimulationStatus(
        run_id=run["run_id"],
        workload_type=run["workload_type"],
        status=run["status"],
        intensity=run["intensity"],
        duration_seconds=run["duration_seconds"],
        started_at=run["started_at"],
        ended_at=run.get("ended_at"),
    )


def get_impact(run_id: str) -> Optional[list[dict]]:
    """Return the time-series impact samples for a finished (or running) workload."""
    with _run_lock:
        return list(_impact_data.get(run_id, []))


def list_runs() -> list[SimulationStatus]:
    with _run_lock:
        runs = list(_active_runs.values())
    return [
        SimulationStatus(
            run_id=r["run_id"],
            workload_type=r["workload_type"],
            status=r["status"],
            intensity=r["intensity"],
            duration_seconds=r["duration_seconds"],
            started_at=r["started_at"],
            ended_at=r.get("ended_at"),
        )
        for r in runs
    ]
