import pytest
from app.schemas import HourlyScenarioInput, BatteryConfig
from app.directives.applier import build_effective_scenario
from app.directives.types import (
    CanonicalDirective,
    DirectiveType,
    NoChargeWindowAdjustment,
    MinimumBatteryReserveAdjustment,
    MaxGridWindowAdjustment
)
from app.optimizer.solver import EnergyOptimizer
from app.optimizer.replay import ReplayValidator

def test_solver_end_of_day_neutrality():
    hours = [
        HourlyScenarioInput(
            hour=h,
            demand_kwh=50.0,
            solar_kwh=80.0 if 9 <= h <= 15 else 0.0,
            tariff_bdt_per_kwh=5.0 if h < 17 else 15.0
        )
        for h in range(24)
    ]
    battery = BatteryConfig(
        capacity_kwh=200.0,
        initial_energy_kwh=100.0,
        minimum_energy_kwh=20.0,
        max_charge_kwh_per_hour=40.0,
        max_discharge_kwh_per_hour=40.0
    )

    scenario = build_effective_scenario(hours, battery, [])
    optimizer = EnergyOptimizer()
    result = optimizer.solve(scenario)

    assert result.success is True
    assert len(result.hourly_plan) == 24
    
    # Check end-of-day neutrality
    final_soc = result.hourly_plan[23].battery_energy_after_kwh
    assert abs(final_soc - 100.0) < 0.01

def test_solver_respects_no_charge_and_reserve():
    hours = [
        HourlyScenarioInput(
            hour=h,
            demand_kwh=60.0,
            solar_kwh=100.0 if 10 <= h <= 14 else 0.0,
            tariff_bdt_per_kwh=6.0 if h < 18 else 14.0
        )
        for h in range(24)
    ]
    battery = BatteryConfig(
        capacity_kwh=250.0,
        initial_energy_kwh=120.0,
        minimum_energy_kwh=30.0,
        max_charge_kwh_per_hour=50.0,
        max_discharge_kwh_per_hour=50.0
    )

    directives = [
        CanonicalDirective(
            directive_type=DirectiveType.NO_CHARGE_WINDOW,
            adjustment=NoChargeWindowAdjustment(hours=[11, 12]),
            applies=True
        ),
        CanonicalDirective(
            directive_type=DirectiveType.MINIMUM_BATTERY_RESERVE,
            adjustment=MinimumBatteryReserveAdjustment(hours=[19, 20], minimum_energy_kwh=110.0),
            applies=True
        )
    ]

    scenario = build_effective_scenario(hours, battery, directives)
    optimizer = EnergyOptimizer()
    result = optimizer.solve(scenario)

    assert result.success is True
    for item in result.hourly_plan:
        if item.hour in [11, 12]:
            assert item.battery_action != "charge"
            assert item.battery_kwh == 0.0 or item.battery_action == "discharge"
        if item.hour in [19, 20]:
            assert item.battery_energy_after_kwh >= 110.0 - 0.01

    validator = ReplayValidator()
    val_res = validator.validate(
        result.hourly_plan,
        scenario,
        result.total_grid_kwh,
        result.total_cost_bdt,
        result.peak_grid_kwh
    )
    assert val_res.passed is True
    assert len(val_res.violations) == 0
