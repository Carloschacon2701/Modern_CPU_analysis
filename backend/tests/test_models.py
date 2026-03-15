import pytest
from pydantic import ValidationError

from models.metrics_schema import (
    CoreStat,
    CpuSnapshot,
    MemorySnapshot,
    DiskIoStat,
    NetIoStat,
    IoSnapshot,
    ProcessEntry,
    ThreadInfo,
    MetricsSnapshot,
    SimulatedDevice,
)
from models.simulation_schema import SimulationRequest, SimulationStatus, WORKLOAD_TYPES


class TestCoreStat:
    def test_valid(self):
        cs = CoreStat(core_id=0, percent=55.5)
        assert cs.core_id == 0
        assert cs.percent == 55.5

    def test_requires_percent(self):
        with pytest.raises(ValidationError):
            CoreStat(core_id=0)  # missing percent


class TestCpuSnapshot:
    def test_valid(self, sample_cpu):
        assert sample_cpu.percent_total == 25.0
        assert len(sample_cpu.percent_per_core) == 2
        assert sample_cpu.context_switches == 50

    def test_zero_cpu_snapshot(self):
        cpu = CpuSnapshot(
            percent_total=0.0,
            percent_per_core=[],
            frequency_mhz=2400.0,
            frequency_min_mhz=800.0,
            frequency_max_mhz=4000.0,
            user_time=0.0,
            system_time=0.0,
            idle_time=1000.0,
            iowait_time=0.0,
            estimated_instructions=0,
            execution_time_s=0.0,
            context_switches=0,
        )
        assert cpu.estimated_instructions == 0
        assert cpu.percent_per_core == []

    def test_requires_all_fields(self):
        with pytest.raises(ValidationError):
            CpuSnapshot(percent_total=50.0)


class TestMemorySnapshot:
    def test_valid(self, sample_memory):
        assert sample_memory.percent == 50.0
        assert sample_memory.simulated_latency_ns == 80.0

    def test_requires_all_fields(self):
        with pytest.raises(ValidationError):
            MemorySnapshot(total_bytes=0)


class TestSimulatedDevice:
    def test_valid(self):
        dev = SimulatedDevice(
            name="nvme0",
            ops_per_sec=1000.0,
            throughput_bytes_per_sec=500_000_000.0,
            latency_ms=0.1,
            active=True,
        )
        assert dev.name == "nvme0"
        assert dev.active is True


class TestIoSnapshot:
    def test_valid(self, sample_io):
        assert sample_io.disk.read_bytes_per_sec == 1024.0
        assert sample_io.network.bytes_recv_per_sec == 200.0
        assert sample_io.simulated_devices == []

    def test_with_simulated_devices(self, sample_io):
        device = SimulatedDevice(
            name="ssd0",
            ops_per_sec=500.0,
            throughput_bytes_per_sec=100_000.0,
            latency_ms=1.0,
            active=True,
        )
        io = sample_io.model_copy(update={"simulated_devices": [device]})
        assert len(io.simulated_devices) == 1
        assert io.simulated_devices[0].name == "ssd0"


class TestProcessEntry:
    def test_valid(self):
        proc = ProcessEntry(
            pid=1234,
            name="python",
            status="running",
            cpu_percent=5.0,
            memory_percent=1.2,
            num_threads=4,
            priority=20,
        )
        assert proc.pid == 1234
        assert proc.threads == []

    def test_with_threads(self):
        thread = ThreadInfo(thread_id=100, user_time=0.5, system_time=0.1)
        proc = ProcessEntry(
            pid=1,
            name="systemd",
            status="sleeping",
            cpu_percent=0.0,
            memory_percent=0.1,
            num_threads=1,
            priority=0,
            threads=[thread],
        )
        assert len(proc.threads) == 1
        assert proc.threads[0].thread_id == 100


class TestMetricsSnapshot:
    def test_valid(self, sample_snapshot):
        assert sample_snapshot.type == "metrics"
        assert sample_snapshot.timestamp == "2026-03-15T00:00:00+00:00"
        assert sample_snapshot.processes == []

    def test_serialization_roundtrip(self, sample_snapshot):
        data = sample_snapshot.model_dump()
        restored = MetricsSnapshot(**data)
        assert restored.cpu.percent_total == sample_snapshot.cpu.percent_total
        assert restored.memory.percent == sample_snapshot.memory.percent
        assert restored.io.disk.read_bytes_per_sec == sample_snapshot.io.disk.read_bytes_per_sec

    def test_json_roundtrip(self, sample_snapshot):
        json_str = sample_snapshot.model_dump_json()
        restored = MetricsSnapshot.model_validate_json(json_str)
        assert restored.type == "metrics"
        assert restored.cpu.frequency_mhz == sample_snapshot.cpu.frequency_mhz


class TestSimulationRequest:
    def test_defaults(self):
        req = SimulationRequest(workload_type="cpu_prime")
        assert req.intensity == 5
        assert req.duration_seconds == 30

    def test_custom_values(self):
        req = SimulationRequest(workload_type="ai_matrix", intensity=8, duration_seconds=60)
        assert req.intensity == 8
        assert req.duration_seconds == 60

    def test_intensity_too_low(self):
        with pytest.raises(ValidationError):
            SimulationRequest(workload_type="cpu_prime", intensity=0)

    def test_intensity_too_high(self):
        with pytest.raises(ValidationError):
            SimulationRequest(workload_type="cpu_prime", intensity=11)

    def test_duration_too_short(self):
        with pytest.raises(ValidationError):
            SimulationRequest(workload_type="cpu_prime", duration_seconds=4)

    def test_duration_too_long(self):
        with pytest.raises(ValidationError):
            SimulationRequest(workload_type="cpu_prime", duration_seconds=121)


class TestWorkloadTypes:
    def test_all_expected_types_present(self):
        expected = {
            "cpu_prime", "cpu_fibonacci", "cpu_sort",
            "memory_sequential", "memory_random",
            "parallel", "ai_matrix", "ai_kmeans", "ai_nn",
        }
        assert set(WORKLOAD_TYPES) == expected

    def test_no_duplicate_types(self):
        assert len(WORKLOAD_TYPES) == len(set(WORKLOAD_TYPES))
