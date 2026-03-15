import pytest
from models.metrics_schema import (
    CpuSnapshot,
    CoreStat,
    MemorySnapshot,
    DiskIoStat,
    NetIoStat,
    IoSnapshot,
    MetricsSnapshot,
)


@pytest.fixture
def sample_cpu():
    return CpuSnapshot(
        percent_total=25.0,
        percent_per_core=[CoreStat(core_id=0, percent=25.0), CoreStat(core_id=1, percent=30.0)],
        frequency_mhz=2400.0,
        frequency_min_mhz=800.0,
        frequency_max_mhz=4000.0,
        user_time=100.0,
        system_time=50.0,
        idle_time=850.0,
        iowait_time=0.0,
        estimated_instructions=150_000_000,
        execution_time_s=120.0,
        context_switches=50,
    )


@pytest.fixture
def sample_memory():
    return MemorySnapshot(
        total_bytes=8 * 1024**3,
        available_bytes=4 * 1024**3,
        used_bytes=4 * 1024**3,
        percent=50.0,
        buffers_bytes=0,
        cached_bytes=0,
        swap_total_bytes=0,
        swap_used_bytes=0,
        swap_percent=0.0,
        read_ops_per_sec=100.0,
        write_ops_per_sec=50.0,
        simulated_latency_ns=80.0,
    )


@pytest.fixture
def sample_io():
    return IoSnapshot(
        disk=DiskIoStat(
            read_bytes_per_sec=1024.0,
            write_bytes_per_sec=512.0,
            read_ops_per_sec=10.0,
            write_ops_per_sec=5.0,
        ),
        network=NetIoStat(
            bytes_sent_per_sec=100.0,
            bytes_recv_per_sec=200.0,
            packets_sent_per_sec=10.0,
            packets_recv_per_sec=20.0,
        ),
        simulated_devices=[],
    )


@pytest.fixture
def sample_snapshot(sample_cpu, sample_memory, sample_io):
    return MetricsSnapshot(
        timestamp="2026-03-15T00:00:00+00:00",
        cpu=sample_cpu,
        memory=sample_memory,
        io=sample_io,
        processes=[],
    )
