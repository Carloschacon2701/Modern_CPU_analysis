import pytest
import core.collector as collector


@pytest.fixture(autouse=True)
def reset_collector():
    collector._snapshot_ring.clear()
    collector._latest_snapshot = None
    yield
    collector._snapshot_ring.clear()
    collector._latest_snapshot = None


def test_get_latest_returns_none_initially():
    assert collector.get_latest() is None


def test_get_history_returns_empty_list_initially():
    assert collector.get_history() == []


def test_get_latest_after_manual_set(sample_snapshot):
    collector._latest_snapshot = sample_snapshot
    assert collector.get_latest() is sample_snapshot


def test_get_history_after_manual_push(sample_snapshot):
    collector._snapshot_ring.append(sample_snapshot)
    history = collector.get_history()
    assert len(history) == 1
    assert history[0] is sample_snapshot


def test_get_history_preserves_order(sample_snapshot):
    from models.metrics_schema import MetricsSnapshot

    snap1 = sample_snapshot.model_copy(update={"timestamp": "2026-03-15T00:00:01+00:00"})
    snap2 = sample_snapshot.model_copy(update={"timestamp": "2026-03-15T00:00:02+00:00"})
    collector._snapshot_ring.append(snap1)
    collector._snapshot_ring.append(snap2)

    history = collector.get_history()
    assert history[0].timestamp == "2026-03-15T00:00:01+00:00"
    assert history[1].timestamp == "2026-03-15T00:00:02+00:00"


def test_ring_buffer_enforces_max_size(sample_snapshot):
    for _ in range(collector.RING_SIZE + 20):
        collector._snapshot_ring.append(sample_snapshot)
    assert len(collector._snapshot_ring) == collector.RING_SIZE


def test_get_history_returns_list_copy(sample_snapshot):
    """Mutating the returned list must not affect the ring buffer."""
    collector._snapshot_ring.append(sample_snapshot)
    history = collector.get_history()
    history.clear()
    assert len(collector._snapshot_ring) == 1


def test_multiple_snapshots_stored(sample_snapshot):
    for i in range(5):
        snap = sample_snapshot.model_copy(
            update={"timestamp": f"2026-03-15T00:00:0{i}+00:00"}
        )
        collector._snapshot_ring.append(snap)
    assert len(collector.get_history()) == 5
