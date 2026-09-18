from app.schemas import DirectiveInterpretationItem, HourlyScenarioInput, BatteryConfig
from app.directives.canonicalizer import canonicalize_interpretation, canonicalize_all
from app.directives.applier import build_effective_scenario
from app.directives.types import DirectiveType

def test_canonicalize_solar_reduction():
    item = DirectiveInterpretationItem(
        note_index=0,
        applies=True,
        directive_type="solar_reduction",
        structured_adjustment={"hours": [13, 14], "factor": 0.2},
        explanation="Solar cut"
    )
    canonical = canonicalize_interpretation(item)
    assert canonical.directive_type == DirectiveType.SOLAR_REDUCTION
    assert canonical.applies is True
    assert canonical.adjustment.factor == 0.2
    assert canonical.adjustment.hours == [13, 14]

def test_canonicalize_no_op():
    item = DirectiveInterpretationItem(
        note_index=1,
        applies=False,
        directive_type="no_op",
        structured_adjustment=None,
        explanation="Lunch break"
    )
    canonical = canonicalize_interpretation(item)
    assert canonical.directive_type == DirectiveType.NO_OP
    assert canonical.applies is False
    assert canonical.adjustment is None

def test_effective_scenario_conflicts():
    hours = [
        HourlyScenarioInput(hour=h, demand_kwh=100.0, solar_kwh=100.0, tariff_bdt_per_kwh=10.0)
        for h in range(24)
    ]
    battery = BatteryConfig(
        capacity_kwh=200.0,
        initial_energy_kwh=100.0,
        minimum_energy_kwh=20.0,
        max_charge_kwh_per_hour=50.0,
        max_discharge_kwh_per_hour=50.0
    )

    items = [
        # Two solar reductions on overlapping hours: factor 0.5 and factor 0.2
        DirectiveInterpretationItem(
            note_index=0,
            applies=True,
            directive_type="solar_reduction",
            structured_adjustment={"hours": [13, 14], "factor": 0.5},
            explanation=""
        ),
        DirectiveInterpretationItem(
            note_index=1,
            applies=True,
            directive_type="solar_reduction",
            structured_adjustment={"hours": [14, 15], "factor": 0.2},
            explanation=""
        ),
        # Two reserves on hour 18: 80 kWh and 120 kWh
        DirectiveInterpretationItem(
            note_index=2,
            applies=True,
            directive_type="minimum_battery_reserve",
            structured_adjustment={"hours": [18], "minimum_energy_kwh": 120.0},
            explanation=""
        )
    ]

    canonical = canonicalize_all(items)
    effective = build_effective_scenario(hours, battery, canonical)

    # Hour 14 had both 0.5 and 0.2, should take strictest (0.2)
    assert effective.effective_solar_kwh[13] == 50.0
    assert effective.effective_solar_kwh[14] == 20.0
    assert effective.effective_solar_kwh[15] == 20.0

    # Hour 18 reserve must be 120.0
    assert effective.dynamic_minimum_energy_kwh[18] == 120.0
    # Other hours should have base reserve 20.0
    assert effective.dynamic_minimum_energy_kwh[0] == 20.0
