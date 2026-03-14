"""
Pydantic models for simulation requests and events.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


WORKLOAD_TYPES = [
    "cpu_prime",
    "cpu_fibonacci",
    "cpu_sort",
    "memory_sequential",
    "memory_random",
    "parallel",
    "ai_matrix",
    "ai_kmeans",
    "ai_nn",
]


class SimulationRequest(BaseModel):
    workload_type: str = Field(
        ..., description=f"One of: {', '.join(WORKLOAD_TYPES)}"
    )
    intensity: int = Field(5, ge=1, le=10, description="Workload intensity 1-10")
    duration_seconds: int = Field(
        30, ge=5, le=120, description="Duration in seconds"
    )


class SimulationStatus(BaseModel):
    run_id: str
    workload_type: str
    status: str  # running | stopped | completed | error
    intensity: int
    duration_seconds: int
    started_at: str
    ended_at: Optional[str] = None


class SimulationEvent(BaseModel):
    type: str = "simulation_event"
    run_id: str
    workload: str
    event: str
    payload: dict[str, Any] = {}
    timestamp: str
