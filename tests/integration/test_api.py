import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_credits_endpoint():
    response = client.get("/api/credits")
    assert response.status_code == 200
    data = response.json()
    assert "members" in data
    names = [m["name"] for m in data["members"]]
    assert "Pritam Biswas" in names
    assert "Gajiul Islam" in names
    assert "Omar Shihab" in names
    assert "Sajjad Hossain Siam" in names

def test_optimize_energy_sample():
    with open("tests/fixtures/sample_request.json") as f:
        payload = json.load(f)

    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scenario_id"] == "bup_benchmark_001"
    assert len(data["directive_interpretation"]) == 3
    assert len(data["hourly_plan"]) == 24
    assert data["total_grid_kwh"] > 0
    assert data["total_cost_bdt"] > 0
    assert data["peak_grid_kwh"] > 0
    assert "plan_summary" in data

    # Check end-of-day battery neutrality
    initial_soc = payload["battery"]["initial_energy_kwh"]
    final_soc = data["hourly_plan"][23]["battery_energy_after_kwh"]
    assert abs(final_soc - initial_soc) < 0.1

def test_optimize_energy_invalid_request():
    response = client.post("/optimize-energy", json={"scenario_id": "bad"})
    assert response.status_code == 422
