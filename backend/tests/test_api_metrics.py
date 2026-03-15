import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch

from api.routes_metrics import router

# Minimal app without lifespan — avoids starting the real collection loop
_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)


def test_snapshot_503_when_no_data():
    with patch("api.routes_metrics.get_latest", return_value=None):
        response = client.get("/api/metrics/snapshot")
    assert response.status_code == 503
    assert "No snapshot available yet" in response.json()["detail"]


def test_snapshot_200_with_data(sample_snapshot):
    with patch("api.routes_metrics.get_latest", return_value=sample_snapshot):
        response = client.get("/api/metrics/snapshot")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "metrics"
    assert "cpu" in data
    assert "memory" in data
    assert "io" in data
    assert "processes" in data


def test_snapshot_returns_correct_cpu_values(sample_snapshot):
    with patch("api.routes_metrics.get_latest", return_value=sample_snapshot):
        response = client.get("/api/metrics/snapshot")
    cpu = response.json()["cpu"]
    assert cpu["percent_total"] == 25.0
    assert cpu["frequency_mhz"] == 2400.0


def test_history_empty():
    with patch("api.routes_metrics.get_history", return_value=[]):
        response = client.get("/api/metrics/history")
    assert response.status_code == 200
    assert response.json() == []


def test_history_returns_list(sample_snapshot):
    with patch("api.routes_metrics.get_history", return_value=[sample_snapshot, sample_snapshot]):
        response = client.get("/api/metrics/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_history_limit_parameter(sample_snapshot):
    snapshots = [sample_snapshot] * 10
    with patch("api.routes_metrics.get_history", return_value=snapshots):
        response = client.get("/api/metrics/history?limit=5")
    assert response.status_code == 200
    assert len(response.json()) == 5


def test_history_limit_does_not_exceed_available(sample_snapshot):
    snapshots = [sample_snapshot] * 3
    with patch("api.routes_metrics.get_history", return_value=snapshots):
        response = client.get("/api/metrics/history?limit=100")
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_history_limit_capped_at_300(sample_snapshot):
    snapshots = [sample_snapshot] * 10
    with patch("api.routes_metrics.get_history", return_value=snapshots):
        response = client.get("/api/metrics/history?limit=999")
    assert response.status_code == 200
    # limit=999 is capped to min(999, 300)=300, but only 10 items available
    assert len(response.json()) == 10
