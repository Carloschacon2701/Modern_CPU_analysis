"""
I/O monitor: real disk/network deltas via psutil + simulated device registry.
"""
from __future__ import annotations

import threading
import time
import psutil
from models.metrics_schema import DiskIoStat, IoSnapshot, NetIoStat, SimulatedDevice
from utils.logger import get_logger

logger = get_logger("monitors.io")

_prev_disk = None
_prev_net = None
_prev_time = time.monotonic()

# Simulated device registry
_devices: dict[str, dict] = {
    "NVMe SSD": {"ops": 0, "bytes": 0, "latency_ms": 0.1, "active": False},
    "USB 3.0": {"ops": 0, "bytes": 0, "latency_ms": 2.5, "active": False},
    "GPU Buffer": {"ops": 0, "bytes": 0, "latency_ms": 0.05, "active": False},
}
_device_lock = threading.Lock()


def activate_device(name: str, ops_delta: int = 0, bytes_delta: int = 0):
    with _device_lock:
        if name in _devices:
            _devices[name]["ops"] += ops_delta
            _devices[name]["bytes"] += bytes_delta
            _devices[name]["active"] = True


def deactivate_device(name: str):
    with _device_lock:
        if name in _devices:
            _devices[name]["active"] = False


def collect() -> IoSnapshot:
    global _prev_disk, _prev_net, _prev_time

    now = time.monotonic()
    elapsed = max(now - _prev_time, 0.001)
    _prev_time = now

    # Disk I/O
    try:
        disk_now = psutil.disk_io_counters()
        if _prev_disk and disk_now:
            read_bps = (disk_now.read_bytes - _prev_disk.read_bytes) / elapsed
            write_bps = (disk_now.write_bytes - _prev_disk.write_bytes) / elapsed
            read_ops = (disk_now.read_count - _prev_disk.read_count) / elapsed
            write_ops = (disk_now.write_count - _prev_disk.write_count) / elapsed
        else:
            read_bps = write_bps = read_ops = write_ops = 0.0
        _prev_disk = disk_now
    except Exception:
        read_bps = write_bps = read_ops = write_ops = 0.0

    disk = DiskIoStat(
        read_bytes_per_sec=max(0.0, round(read_bps, 2)),
        write_bytes_per_sec=max(0.0, round(write_bps, 2)),
        read_ops_per_sec=max(0.0, round(read_ops, 2)),
        write_ops_per_sec=max(0.0, round(write_ops, 2)),
    )

    # Network I/O
    try:
        net_now = psutil.net_io_counters()
        if _prev_net and net_now:
            sent_bps = (net_now.bytes_sent - _prev_net.bytes_sent) / elapsed
            recv_bps = (net_now.bytes_recv - _prev_net.bytes_recv) / elapsed
            pkts_sent = (net_now.packets_sent - _prev_net.packets_sent) / elapsed
            pkts_recv = (net_now.packets_recv - _prev_net.packets_recv) / elapsed
        else:
            sent_bps = recv_bps = pkts_sent = pkts_recv = 0.0
        _prev_net = net_now
    except Exception:
        sent_bps = recv_bps = pkts_sent = pkts_recv = 0.0

    network = NetIoStat(
        bytes_sent_per_sec=max(0.0, round(sent_bps, 2)),
        bytes_recv_per_sec=max(0.0, round(recv_bps, 2)),
        packets_sent_per_sec=max(0.0, round(pkts_sent, 2)),
        packets_recv_per_sec=max(0.0, round(pkts_recv, 2)),
    )

    # Simulated devices
    sim_devices = []
    with _device_lock:
        for name, stats in _devices.items():
            ops_per_sec = stats["ops"] / elapsed if stats["active"] else 0.0
            bps = stats["bytes"] / elapsed if stats["active"] else 0.0
            sim_devices.append(
                SimulatedDevice(
                    name=name,
                    ops_per_sec=round(ops_per_sec, 2),
                    throughput_bytes_per_sec=round(bps, 2),
                    latency_ms=stats["latency_ms"],
                    active=stats["active"],
                )
            )
            # Reset deltas
            stats["ops"] = 0
            stats["bytes"] = 0

    return IoSnapshot(disk=disk, network=network, simulated_devices=sim_devices)
