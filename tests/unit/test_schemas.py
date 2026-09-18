import json
import pytest
from pydantic import ValidationError
from app.schemas import (
    OptimizeEnergyRequest,
    HourlyScenarioInput,
    BatteryConfig,
    OptimizeEnergyResponse,
    DirectiveInterpretationItem,
    HourlyPlanItem,
    BatteryAction
)

@pytest.fixture
def valid_request_data():
    with open("tests/fixtures/sample_request.json") as f:
        return json.load(f)

def test_valid_request(valid_request_data):
    req = OptimizeEnergyRequest(**valid_request_data)
    assert req.scenario_id == "bup_benchmark_001"
    assert len(req.hours) == 24
    assert len(req.operator_notes) == 3

def test_missing_scenario_id(valid_request_data):
    data = dict(valid_request_data)
    del data["scenario_id"]
    with pytest.raises(ValidationError):
        OptimizeEnergyRequest(**data)

def test_less_than_24_hours(valid_request_data):
    data = dict(valid_request_data)
    data["hours"] = data["hours"][:20]
    with pytest.raises(ValidationError) as exc:
        OptimizeEnergyRequest(**data)
    assert "Exactly 24 hours required" in str(exc.value)

def test_duplicate_hour(valid_request_data):
    data = dict(valid_request_data)
    # duplicate hour 0
    data["hours"][1]["hour"] = 0
    with pytest.raises(ValidationError) as exc:
        OptimizeEnergyRequest(**data)
    assert "Duplicate hour found" in str(exc.value)

def test_invalid_notes_count(valid_request_data):
    data = dict(valid_request_data)
    data["operator_notes"] = []
    with pytest.raises(ValidationError):
        OptimizeEnergyRequest(**data)

    data["operator_notes"] = ["1", "2", "3", "4"]
    with pytest.raises(ValidationError):
        OptimizeEnergyRequest(**data)

def test_empty_note_string(valid_request_data):
    data = dict(valid_request_data)
    data["operator_notes"] = ["valid", "   ", "valid2"]
    with pytest.raises(ValidationError):
        OptimizeEnergyRequest(**data)

def test_negative_demand(valid_request_data):
    data = dict(valid_request_data)
    data["hours"][0]["demand_kwh"] = -5.0
    with pytest.raises(ValidationError):
        OptimizeEnergyRequest(**data)

def test_invalid_battery_initial_exceeds_capacity():
    with pytest.raises(ValidationError):
        BatteryConfig(
            capacity_kwh=100.0,
            initial_energy_kwh=150.0,
            minimum_energy_kwh=20.0,
            max_charge_kwh_per_hour=30.0,
            max_discharge_kwh_per_hour=30.0
        )

def test_invalid_battery_initial_below_min():
    with pytest.raises(ValidationError):
        BatteryConfig(
            capacity_kwh=100.0,
            initial_energy_kwh=10.0,
            minimum_energy_kwh=20.0,
            max_charge_kwh_per_hour=30.0,
            max_discharge_kwh_per_hour=30.0
        )
