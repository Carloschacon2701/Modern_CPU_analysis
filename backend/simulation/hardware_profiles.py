"""
Hardware profiles for simulating different CPU/memory configurations.

Each profile represents a real-world processor family. When a workload runs
under a profile, the runner throttles each iteration with time.sleep() so the
real machine mimics the target hardware's speed.

Throttling formula (applied per iteration, only when cpu_factor < 1.0):
    sleep = iter_time * (1 / cpu_factor - 1)
    capped at MAX_THROTTLE_SLEEP_S to keep tests usable.

For faster hardware (cpu_factor > 1.0) no throttle is applied — the machine
simply runs at its real speed, which is a lower bound on what faster hardware
would achieve.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

MAX_THROTTLE_SLEEP_S = 8.0  # never sleep more than this per iteration


@dataclass
class HardwareProfile:
    id: str
    cpu_cores: int
    cpu_freq_mhz: float
    cpu_freq_max_mhz: float
    memory_total_mb: int
    cpu_factor: float
    """
    Relative single-thread CPU performance vs. a modern mid-range laptop.
    Values < 1 → slower; values > 1 → faster. Used to throttle workloads.
    """
    memory_latency_multiplier: float
    """
    Multiplier applied to base DRAM latency thresholds.
    1.0 → standard DDR4 (~80 ns low pressure).
    1.5 → LPDDR4 (Raspberry Pi, phones).
    """

    def throttle(self, iter_duration_s: float) -> None:
        """Sleep to simulate this hardware being slower than the real machine."""
        if self.cpu_factor < 1.0 and iter_duration_s > 0:
            sleep_s = iter_duration_s * (1.0 / self.cpu_factor - 1.0)
            time.sleep(min(sleep_s, MAX_THROTTLE_SLEEP_S))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "cpu_cores": self.cpu_cores,
            "cpu_freq_mhz": self.cpu_freq_mhz,
            "cpu_freq_max_mhz": self.cpu_freq_max_mhz,
            "memory_total_mb": self.memory_total_mb,
            "cpu_factor": self.cpu_factor,
            "memory_latency_multiplier": self.memory_latency_multiplier,
        }


PROFILES: dict[str, HardwareProfile] = {
    "real_machine": HardwareProfile(
        id="real_machine",
        cpu_cores=0,            # 0 = use actual core count from psutil
        cpu_freq_mhz=0.0,       # 0 = use actual frequency from psutil
        cpu_freq_max_mhz=0.0,
        memory_total_mb=0,      # 0 = use actual RAM from psutil
        cpu_factor=1.0,
        memory_latency_multiplier=1.0,
    ),
    "raspberry_pi4": HardwareProfile(
        id="raspberry_pi4",
        cpu_cores=4,
        cpu_freq_mhz=1800,
        cpu_freq_max_mhz=1800,
        memory_total_mb=4096,
        cpu_factor=0.15,
        memory_latency_multiplier=1.5,   # LPDDR4
    ),
    "old_laptop_2012": HardwareProfile(
        id="old_laptop_2012",
        cpu_cores=2,
        cpu_freq_mhz=1600,
        cpu_freq_max_mhz=2100,
        memory_total_mb=4096,
        cpu_factor=0.28,
        memory_latency_multiplier=1.2,   # DDR3
    ),
    "cloud_t3micro": HardwareProfile(
        id="cloud_t3micro",
        cpu_cores=2,
        cpu_freq_mhz=2500,
        cpu_freq_max_mhz=3100,
        memory_total_mb=1024,
        cpu_factor=0.42,
        memory_latency_multiplier=1.1,   # DDR4, burstable
    ),
    "server_xeon": HardwareProfile(
        id="server_xeon",
        cpu_cores=16,
        cpu_freq_mhz=2300,
        cpu_freq_max_mhz=3600,
        memory_total_mb=131072,
        cpu_factor=1.80,
        memory_latency_multiplier=0.9,   # ECC DDR4 registered
    ),
    "gaming_desktop_i9": HardwareProfile(
        id="gaming_desktop_i9",
        cpu_cores=24,
        cpu_freq_mhz=3000,
        cpu_freq_max_mhz=5800,
        memory_total_mb=32768,
        cpu_factor=2.50,
        memory_latency_multiplier=0.75,  # DDR5 high-bandwidth
    ),
}
