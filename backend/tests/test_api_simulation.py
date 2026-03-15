import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch
from datetime import datetime, timezone

from api.routes_simulation import router
from models.simulation_schema import SimulationStatus, WORKLOAD_TYPES

_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)


def _make_status(run_id="run-1", workload_type="cpu_prime", status="running"):
    return SimulationStatus(
        run_id=run_id,
        workload_type=workload_type,
        status=status,
        intensity=5,
        duration_seconds=30,
        started_at=datetime.now(timezone.utc).isoformat(),
    )


def test_get_workload_types():
    response = client.get("/api/simulation/workloads")
    assert response.status_code == 200
    data = response.json()
    assert "workload_types" in data
    assert set(data["workload_types"]) == set(WORKLOAD_TYPES)


def test_start_simulation_valid():
    with patch("api.routes_simulation.start_workload", return_value="run-abc"):
        response = client.post(
            "/api/simulation/start",
            json={"workload_type": "cpu_prime", "intensity": 5, "duration_seconds": 30},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == "run-abc"
    assert data["status"] == "running"
    assert data["workload_type"] == "cpu_prime"


def test_start_simulation_invalid_workload():
    response = client.post(
        "/api/simulation/start",
        json={"workload_type": "not_a_real_workload", "intensity": 5, "duration_seconds": 30},
    )
    assert response.status_code == 400


def test_start_simulation_calls_runner_for_each_workload_type():
    for wt in WORKLOAD_TYPES:
        with patch("api.routes_simulation.start_workload", return_value="run-x") as mock_start:
            response = client.post(
                "/api/simulation/start",
                json={"workload_type": wt, "intensity": 3, "duration_seconds": 10},
            )
        assert response.status_code == 200, f"Failed for workload_type={wt}"
        mock_start.assert_called_once()


def test_stop_simulation_found():
    with patch("api.routes_simulation.stop_workload", return_value=True):
        response = client.post("/api/simulation/stop/run-1")
    assert response.status_code == 200
    assert response.json() == {"run_id": "run-1", "status": "stopped"}


def test_stop_simulation_not_found():
    with patch("api.routes_simulation.stop_workload", return_value=False):
        response = client.post("/api/simulation/stop/nonexistent")
    assert response.status_code == 404


def test_get_status_found():
    st = _make_status("run-42", "ai_matrix", "running")
    with patch("api.routes_simulation.get_status", return_value=st):
        response = client.get("/api/simulation/status/run-42")
    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == "run-42"
    assert data["workload_type"] == "ai_matrix"
    assert data["status"] == "running"


def test_get_status_not_found():
    with patch("api.routes_simulation.get_status", return_value=None):
        response = client.get("/api/simulation/status/nonexistent")
    assert response.status_code == 404


def test_list_runs_empty():
    with patch("api.routes_simulation.list_runs", return_value=[]):
        response = client.get("/api/simulation/runs")
    assert response.status_code == 200
    assert response.json() == []


def test_list_runs_with_data():
    runs = [_make_status("r1"), _make_status("r2", "memory_random")]
    with patch("api.routes_simulation.list_runs", return_value=runs):
        response = client.get("/api/simulation/runs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    run_ids = {r["run_id"] for r in data}
    assert run_ids == {"r1", "r2"}
