from app.schemas import HourlyPlanItem, HourlyScenarioInput, BatteryConfig, BatteryAction
from app.directives.applier import build_effective_scenario
from app.directives.types import CanonicalDirective, DirectiveType, NoChargeWindowAdjustment
from app.optimizer.replay import ReplayValidator

def test_replay_detects_violations():
    hours = [
        HourlyScenarioInput(hour=h, demand_kwh=50.0, solar_kwh=0.0, tariff_bdt_per_kwh=10.0)
        for h in range(24)
    ]
    battery = BatteryConfig(
        capacity_kwh=100.0,
        initial_energy_kwh=50.0,
        minimum_energy_kwh=20.0,
        max_charge_kwh_per_hour=30.0,
        max_discharge_kwh_per_hour=30.0
    )

    directives = [
        CanonicalDirective(
            directive_type=DirectiveType.NO_CHARGE_WINDOW,
            adjustment=NoChargeWindowAdjustment(hours=[2]),
            applies=True
        )
    ]

    scenario = build_effective_scenario(hours, battery, directives)
    
    # Construct a deliberately invalid plan: charges on hour 2
    plan = []
    soc = 50.0
    for h in range(24):
        if h == 2:
            # Illegal charge during no_charge_window
            act = BatteryAction.CHARGE
            bkwh = 10.0
            soc += 10.0
            grid = 60.0  # supply = 60, demand + charge = 50 + 10 = 60
        else:
            act = BatteryAction.IDLE
            bkwh = 0.0
            grid = 50.0
            
        plan.append(
            HourlyPlanItem(
                hour=h,
                grid_kwh=grid,
                solar_used_kwh=0.0,
                battery_action=act,
                battery_kwh=bkwh,
                battery_energy_after_kwh=soc
            )
        )

    validator = ReplayValidator()
    result = validator.validate(
        plan=plan,
        scenario=scenario,
        reported_total_grid=sum(p.grid_kwh for p in plan),
        reported_total_cost=sum(p.grid_kwh * 10.0 for p in plan),
        reported_peak_grid=60.0
    )

    assert result.passed is False
    assert any("charging during blocked no-charge window" in v for v in result.violations)
    assert any("End-of-day neutrality violated" in v for v in result.violations)
