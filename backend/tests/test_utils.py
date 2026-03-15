import time
from datetime import datetime, timezone

import pytest

from utils.time_utils import elapsed_seconds, monotonic_ms, now_iso


def test_now_iso_is_valid_datetime():
    ts = now_iso()
    dt = datetime.fromisoformat(ts)
    assert dt.tzinfo is not None


def test_now_iso_is_utc():
    ts = now_iso()
    dt = datetime.fromisoformat(ts)
    assert dt.utcoffset().total_seconds() == 0


def test_now_iso_returns_string():
    assert isinstance(now_iso(), str)


def test_now_iso_changes_over_time():
    t1 = now_iso()
    time.sleep(0.001)
    t2 = now_iso()
    assert t1 != t2


def test_monotonic_ms_returns_float():
    ms = monotonic_ms()
    assert isinstance(ms, float)
    assert ms > 0


def test_monotonic_ms_non_decreasing():
    t1 = monotonic_ms()
    t2 = monotonic_ms()
    assert t2 >= t1


def test_monotonic_ms_scale():
    # monotonic_ms should be well above 0 (process has been running)
    assert monotonic_ms() > 0


def test_elapsed_seconds_near_zero():
    start = time.monotonic()
    elapsed = elapsed_seconds(start)
    assert 0.0 <= elapsed < 0.5


def test_elapsed_seconds_after_sleep():
    start = time.monotonic()
    time.sleep(0.05)
    elapsed = elapsed_seconds(start)
    assert elapsed >= 0.04


def test_elapsed_seconds_increases():
    start = time.monotonic()
    e1 = elapsed_seconds(start)
    time.sleep(0.01)
    e2 = elapsed_seconds(start)
    assert e2 > e1
