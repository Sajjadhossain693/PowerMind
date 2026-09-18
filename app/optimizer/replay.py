import math
from typing import List, Tuple, Optional
from pydantic import BaseModel
from app.schemas import HourlyPlanItem, BatteryAction
from app.directives.applier import EffectiveScenario
from app.utils.numeric import is_close, TOLERANCE

class ReplayValidationResult(BaseModel):
    passed: bool
    violations: List[str]
    recalculated_total_grid: float
    recalculated_total_cost: float
    recalculated_peak_grid: float

class ReplayValidator:
    def __init__(self, tolerance: float = TOLERANCE):
        self.tolerance = tolerance

    def validate(
        self,
        plan: List[HourlyPlanItem],
        scenario: EffectiveScenario,
        reported_total_grid: float,
        reported_total_cost: float,
        reported_peak_grid: float
    ) -> ReplayValidationResult:
        """
        Independently verifies the 24-hour plan against all physical,
        operational, and directive constraints.
        Does not depend on the solver.
        """
        violations: List[str] = []

        if len(plan) != 24:
            violations.append(f"Plan length {len(plan)} is not exactly 24")
            return ReplayValidationResult(
                passed=False,
                violations=violations,
                recalculated_total_grid=0.0,
                recalculated_total_cost=0.0,
                recalculated_peak_grid=0.0
            )

        calc_total_grid = 0.0
        calc_total_cost = 0.0
        calc_peak_grid = 0.0
        prev_soc = scenario.initial_energy_kwh

        for h in range(24):
            item = plan[h]
            if item.hour != h:
                violations.append(f"Hour order mismatch: expected {h}, got {item.hour}")

            # 1. Non-negativity
            if item.grid_kwh < -self.tolerance:
                violations.append(f"Hour {h}: negative grid import ({item.grid_kwh})")
            if item.solar_used_kwh < -self.tolerance:
                violations.append(f"Hour {h}: negative solar used ({item.solar_used_kwh})")
            if item.battery_kwh < -self.tolerance:
                violations.append(f"Hour {h}: negative battery kwh ({item.battery_kwh})")

            # 2. Solar usage <= effective solar
            eff_solar = scenario.effective_solar_kwh[h]
            if item.solar_used_kwh > eff_solar + self.tolerance:
                violations.append(
                    f"Hour {h}: solar used ({item.solar_used_kwh}) exceeds effective solar ({eff_solar})"
                )

            # 3. Action and battery_kwh consistency
            charge_val = item.battery_kwh if item.battery_action == BatteryAction.CHARGE else 0.0
            discharge_val = item.battery_kwh if item.battery_action == BatteryAction.DISCHARGE else 0.0
            
            if item.battery_action == BatteryAction.IDLE and item.battery_kwh > self.tolerance:
                violations.append(f"Hour {h}: battery is idle but battery_kwh is {item.battery_kwh}")

            # 4. Energy balance: grid + solar_used + discharge = demand + charge
            supply = item.grid_kwh + item.solar_used_kwh + discharge_val
            demand = scenario.demand_kwh[h] + charge_val
            if not is_close(supply, demand, tol=0.05):
                violations.append(
                    f"Hour {h}: energy balance violation (supply {round(supply, 3)} != demand {round(demand, 3)})"
                )

            # 5. Battery transition
            expected_soc = prev_soc + charge_val - discharge_val
            if not is_close(item.battery_energy_after_kwh, expected_soc, tol=0.05):
                violations.append(
                    f"Hour {h}: battery SOC transition error (expected {round(expected_soc, 3)}, got {item.battery_energy_after_kwh})"
                )

            # 6. Battery capacity & dynamic reserve bounds
            if item.battery_energy_after_kwh > scenario.capacity_kwh + self.tolerance:
                violations.append(
                    f"Hour {h}: battery SOC ({item.battery_energy_after_kwh}) exceeds capacity ({scenario.capacity_kwh})"
                )
            
            min_reserve = scenario.dynamic_minimum_energy_kwh[h]
            if item.battery_energy_after_kwh < min_reserve - self.tolerance:
                violations.append(
                    f"Hour {h}: battery SOC ({item.battery_energy_after_kwh}) violates reserve ({min_reserve})"
                )

            # 7. Rate limits
            if charge_val > scenario.max_charge_kwh_per_hour + self.tolerance:
                violations.append(
                    f"Hour {h}: charge rate ({charge_val}) exceeds limit ({scenario.max_charge_kwh_per_hour})"
                )
            if discharge_val > scenario.max_discharge_kwh_per_hour + self.tolerance:
                violations.append(
                    f"Hour {h}: discharge rate ({discharge_val}) exceeds limit ({scenario.max_discharge_kwh_per_hour})"
                )

            # 8. Windows
            if h in scenario.blocked_charge_hours and charge_val > self.tolerance:
                violations.append(f"Hour {h}: charging during blocked no-charge window")

            if h in scenario.blocked_discharge_hours and discharge_val > self.tolerance:
                violations.append(f"Hour {h}: discharging during blocked no-discharge window")

            if h in scenario.grid_caps and item.grid_kwh > scenario.grid_caps[h] + self.tolerance:
                violations.append(
                    f"Hour {h}: grid import ({item.grid_kwh}) exceeds cap ({scenario.grid_caps[h]})"
                )

            # Recompute totals
            calc_total_grid += item.grid_kwh
            calc_total_cost += item.grid_kwh * scenario.tariff_bdt_per_kwh[h]
            if item.grid_kwh > calc_peak_grid:
                calc_peak_grid = item.grid_kwh

            prev_soc = item.battery_energy_after_kwh

        # 9. Mandatory End-of-Day Neutrality
        final_soc = plan[23].battery_energy_after_kwh
        if not is_close(final_soc, scenario.initial_energy_kwh, tol=0.05):
            violations.append(
                f"End-of-day neutrality violated: final SOC {final_soc} != initial {scenario.initial_energy_kwh}"
            )

        # 10. Check reported totals against recalculated
        if not is_close(reported_total_grid, calc_total_grid, tol=0.1):
            violations.append(
                f"Reported total grid ({reported_total_grid}) mismatch with recalculated ({round(calc_total_grid, 3)})"
            )
        if not is_close(reported_total_cost, calc_total_cost, tol=0.5):
            violations.append(
                f"Reported total cost ({reported_total_cost}) mismatch with recalculated ({round(calc_total_cost, 3)})"
            )

        passed = len(violations) == 0
        return ReplayValidationResult(
            passed=passed,
            violations=violations,
            recalculated_total_grid=round(calc_total_grid, 4),
            recalculated_total_cost=round(calc_total_cost, 4),
            recalculated_peak_grid=round(calc_peak_grid, 4)
        )
