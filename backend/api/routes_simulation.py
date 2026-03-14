"""
REST endpoints for simulation control:
  POST /api/simulation/start
  POST /api/simulation/stop
  GET  /api/simulation/status/{run_id}
  GET  /api/simulation/runs
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from models.simulation_schema import SimulationRequest, WORKLOAD_TYPES
from simulation.workload_runner import start_workload, stop_workload, get_status, list_runs, get_impact

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/start")
async def start(request: SimulationRequest):
    if request.workload_type not in WORKLOAD_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workload_type. Must be one of: {WORKLOAD_TYPES}",
        )
    run_id = start_workload(request.model_dump())
    return {"run_id": run_id, "status": "running", "workload_type": request.workload_type}


@router.post("/stop/{run_id}")
async def stop(run_id: str):
    ok = stop_workload(run_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return {"run_id": run_id, "status": "stopped"}


@router.get("/status/{run_id}")
async def status(run_id: str):
    s = get_status(run_id)
    if not s:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return s.model_dump()


@router.get("/runs")
async def runs():
    return [r.model_dump() for r in list_runs()]


@router.get("/workloads")
async def workload_types():
    return {"workload_types": WORKLOAD_TYPES}


@router.get("/impact/{run_id}")
async def impact(run_id: str):
    """
    Returns time-series metric samples captured every 500 ms during the workload.
    Each sample contains: elapsed_s, cpu_percent, memory_percent,
    disk_read_bps, disk_write_bps, net_sent_bps, net_recv_bps, total_thread_count.
    Available while the workload is still running (partial) or after it completes.
    """
    data = get_impact(run_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"No impact data for run {run_id}")
    status = get_status(run_id)
    return {
        "run_id": run_id,
        "workload_type": status.workload_type if status else "unknown",
        "status": status.status if status else "unknown",
        "sample_count": len(data),
        "interval_s": 0.5,
        "samples": data,
    }
