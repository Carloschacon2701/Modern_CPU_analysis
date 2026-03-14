"""
Workload runner: orchestrates all simulation workloads.
Runs each in a background thread, emits events via WebSocket broadcaster.
"""
from __future__ import annotations

import threading
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Callable, Optional

from models.simulation_schema import SimulationEvent, SimulationStatus
from utils.logger import get_logger
from utils.time_utils import now_iso

logger = get_logger("simulation.runner")

_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="workload")
_active_runs: dict[str, dict] = {}
_run_lock = threading.Lock()
_broadcast_cb: Optional[Callable[[dict], None]] = None


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
        logger.error(f"Workload {workload_type} failed: {exc}")
        emit("error", {"message": str(exc)})
        with _run_lock:
            if run_id in _active_runs:
                _active_runs[run_id]["status"] = "error"
                _active_runs[run_id]["ended_at"] = now_iso()


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

    future: Future | None = run.get("_future")
    if future:
        future.cancel()

    with _run_lock:
        if run_id in _active_runs:
            _active_runs[run_id]["status"] = "stopped"
            _active_runs[run_id]["ended_at"] = now_iso()

    logger.info(f"Stopped workload run_id={run_id}")
    return True


def get_status(run_id: str) -> SimulationStatus | None:
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
