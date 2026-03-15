import pytest
from unittest.mock import MagicMock, patch

from models.metrics_schema import CpuSnapshot
import monitors.cpu_monitor as cpu_monitor


def _make_freq(current=2400.0, min_mhz=800.0, max_mhz=4000.0):
    freq = MagicMock()
    freq.current = current
    freq.min = min_mhz
    freq.max = max_mhz
    return freq


def _make_times(user=100.0, system=50.0, idle=850.0, iowait=0.0):
    times = MagicMock()
    times.user = user
    times.system = system
    times.idle = idle
    times.iowait = iowait
    return times


def _make_stats(ctx_switches=1000):
    stats = MagicMock()
    stats.ctx_switches = ctx_switches
    return stats


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_collect_returns_cpu_snapshot(mock_percent, mock_freq, mock_times, mock_stats):
    mock_percent.side_effect = [50.0, [50.0, 60.0]]
    mock_freq.return_value = _make_freq(2400.0, 800.0, 4000.0)
    mock_times.return_value = _make_times(100.0, 50.0, 850.0, 0.0)
    mock_stats.return_value = _make_stats(1000)
    cpu_monitor._last_ctx_switches = 900

    result = cpu_monitor.collect()

    assert isinstance(result, CpuSnapshot)
    assert result.percent_total == 50.0
    assert len(result.percent_per_core) == 2
    assert result.percent_per_core[0].core_id == 0
    assert result.percent_per_core[1].core_id == 1
    assert result.frequency_mhz == 2400.0
    assert result.context_switches == 100  # 1000 - 900


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_collect_fallback_when_freq_unavailable(mock_percent, mock_freq, mock_times, mock_stats):
    mock_percent.side_effect = [0.0, []]
    mock_freq.side_effect = Exception("no freq data")
    mock_times.return_value = _make_times()
    mock_stats.return_value = _make_stats(0)
    cpu_monitor._last_ctx_switches = 0

    result = cpu_monitor.collect()

    assert result.frequency_mhz == 2400.0
    assert result.frequency_min_mhz == 800.0
    assert result.frequency_max_mhz == 4000.0


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_estimated_instructions_formula(mock_percent, mock_freq, mock_times, mock_stats):
    """
    Formula: cpu_percent/100 * freq_mhz * 1e6 * interval_s * IPC(2.5)
    At 100% utilization on a 1000 MHz CPU: 1.0 * 1000 * 1e6 * 1.0 * 2.5 = 2_500_000_000
    """
    mock_percent.side_effect = [100.0, [100.0]]
    mock_freq.return_value = _make_freq(current=1000.0)
    mock_times.return_value = _make_times()
    mock_stats.return_value = _make_stats(0)
    cpu_monitor._last_ctx_switches = 0

    result = cpu_monitor.collect()

    assert result.estimated_instructions == 2_500_000_000


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_estimated_instructions_zero_at_idle(mock_percent, mock_freq, mock_times, mock_stats):
    mock_percent.side_effect = [0.0, []]
    mock_freq.return_value = _make_freq()
    mock_times.return_value = _make_times()
    mock_stats.return_value = _make_stats(0)
    cpu_monitor._last_ctx_switches = 0

    result = cpu_monitor.collect()

    assert result.estimated_instructions == 0


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_collect_handles_missing_iowait(mock_percent, mock_freq, mock_times, mock_stats):
    """iowait is not available on all platforms; getattr should default to 0.0"""
    mock_percent.side_effect = [0.0, []]
    mock_freq.return_value = _make_freq()
    # Simulate a platform without iowait (e.g. macOS)
    times = MagicMock(spec=["user", "system", "idle"])
    times.user = 100.0
    times.system = 50.0
    times.idle = 850.0
    mock_times.return_value = times
    mock_stats.return_value = _make_stats(0)
    cpu_monitor._last_ctx_switches = 0

    result = cpu_monitor.collect()

    assert result.iowait_time == 0.0


@patch("monitors.cpu_monitor.psutil.cpu_stats")
@patch("monitors.cpu_monitor.psutil.cpu_times")
@patch("monitors.cpu_monitor.psutil.cpu_freq")
@patch("monitors.cpu_monitor.psutil.cpu_percent")
def test_context_switches_delta_accumulated(mock_percent, mock_freq, mock_times, mock_stats):
    """context_switches is the delta between calls, not the absolute count."""
    mock_freq.return_value = _make_freq()
    mock_times.return_value = _make_times()

    mock_percent.side_effect = [10.0, [10.0]]
    mock_stats.return_value = _make_stats(500)
    cpu_monitor._last_ctx_switches = 400
    first = cpu_monitor.collect()
    assert first.context_switches == 100

    mock_percent.side_effect = [10.0, [10.0]]
    mock_stats.return_value = _make_stats(700)
    second = cpu_monitor.collect()
    assert second.context_switches == 200
