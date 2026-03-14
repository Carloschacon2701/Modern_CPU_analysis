"""
Pydantic models for all metric snapshots sent over WebSocket and REST.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class CoreStat(BaseModel):
    core_id: int
    percent: float


class CpuSnapshot(BaseModel):
    percent_total: float = Field(..., description="Overall CPU utilization %")
    percent_per_core: list[CoreStat]
    frequency_mhz: float
    frequency_min_mhz: float
    frequency_max_mhz: float
    user_time: float
    system_time: float
    idle_time: float
    iowait_time: float
    estimated_instructions: int = Field(
        ...,
        description=(
            "Estimated instructions = cpu_percent * freq_mhz * interval_s * IPC_CONSTANT(2.5). "
            "This is a simulation-derived approximation, not a hardware PMU counter."
        ),
    )
    execution_time_s: float = Field(..., description="Process uptime in seconds")
    context_switches: int


class MemorySnapshot(BaseModel):
    total_bytes: int
    available_bytes: int
    used_bytes: int
    percent: float
    buffers_bytes: int
    cached_bytes: int
    swap_total_bytes: int
    swap_used_bytes: int
    swap_percent: float
    read_ops_per_sec: float = Field(
        ..., description="Simulated memory read operations per second"
    )
    write_ops_per_sec: float = Field(
        ..., description="Simulated memory write operations per second"
    )
    simulated_latency_ns: float = Field(
        ...,
        description=(
            "Estimated DRAM latency based on pressure curve: "
            "0-60%→80ns, 60-80%→120ns, 80-95%→200ns, 95%+→400ns"
        ),
    )


class DiskIoStat(BaseModel):
    read_bytes_per_sec: float
    write_bytes_per_sec: float
    read_ops_per_sec: float
    write_ops_per_sec: float


class NetIoStat(BaseModel):
    bytes_sent_per_sec: float
    bytes_recv_per_sec: float
    packets_sent_per_sec: float
    packets_recv_per_sec: float


class SimulatedDevice(BaseModel):
    name: str
    ops_per_sec: float
    throughput_bytes_per_sec: float
    latency_ms: float
    active: bool


class IoSnapshot(BaseModel):
    disk: DiskIoStat
    network: NetIoStat
    simulated_devices: list[SimulatedDevice]


class ThreadInfo(BaseModel):
    thread_id: int
    user_time: float
    system_time: float


class ProcessEntry(BaseModel):
    pid: int
    name: str
    status: str
    cpu_percent: float
    memory_percent: float
    num_threads: int
    priority: int
    threads: list[ThreadInfo] = []


class MetricsSnapshot(BaseModel):
    type: str = "metrics"
    timestamp: str
    cpu: CpuSnapshot
    memory: MemorySnapshot
    io: IoSnapshot
    processes: list[ProcessEntry]
