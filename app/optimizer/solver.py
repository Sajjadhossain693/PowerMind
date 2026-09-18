import logging
from typing import List, Optional
from ortools.linear_solver import pywraplp
from app.directives.applier import EffectiveScenario
from app.schemas import HourlyPlanItem, BatteryAction
from app.optimizer.model import SolverResult
from app.utils.numeric import round_metric, TOLERANCE

logger = logging.getLogger("powermind.solver")

class EnergyOptimizer:
    def __init__(self, tolerance: float = TOLERANCE, timeout_seconds: float = 10.0):
        self.tolerance = tolerance
        self.timeout_seconds = timeout_seconds

    def solve(self, scenario: EffectiveScenario) -> SolverResult:
        """
        Solves the 24-hour deterministic campus energy scheduling problem.
        Uses OR-Tools MILP solver with strict physical and operational constraints.
        """
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")
        if not solver:
            # Fallback to general linear solver
            solver = pywraplp.Solver.CreateSolver("GLOP")

        if not solver:
            raise RuntimeError("Could not initialize OR-Tools linear solver")

        solver.set_time_limit(int(self.timeout_seconds * 1000))

        num_hours = 24
        
        # Decision variables
        grid = [solver.NumVar(0.0, solver.infinity(), f"grid_{h}") for h in range(num_hours)]
        solar_used = [
            solver.NumVar(0.0, max(0.0, scenario.effective_solar_kwh[h]), f"solar_used_{h}")
            for h in range(num_hours)
        ]
        
        charge = [
            solver.NumVar(0.0, scenario.max_charge_kwh_per_hour, f"charge_{h}")
            for h in range(num_hours)
        ]
        discharge = [
            solver.NumVar(0.0, scenario.max_discharge_kwh_per_hour, f"discharge_{h}")
            for h in range(num_hours)
        ]
        
        battery_energy_after = [
            solver.NumVar(
                scenario.dynamic_minimum_energy_kwh[h],
                scenario.capacity_kwh,
                f"battery_energy_after_{h}"
            )
            for h in range(num_hours)
        ]
        
        # Mode variables to enforce mutual exclusivity of charge and discharge
        is_charging = [solver.BoolVar(f"is_charging_{h}") for h in range(num_hours)]
        is_discharging = [solver.BoolVar(f"is_discharging_{h}") for h in range(num_hours)]

        # 1. Operational and Physical Constraints per hour
        for h in range(num_hours):
            # Mutual exclusivity
            solver.Add(is_charging[h] + is_discharging[h] <= 1)
            
            # Linking variables to binary modes
            solver.Add(charge[h] <= scenario.max_charge_kwh_per_hour * is_charging[h])
            solver.Add(discharge[h] <= scenario.max_discharge_kwh_per_hour * is_discharging[h])
            
            # Directive: Blocked charge hours
            if h in scenario.blocked_charge_hours:
                solver.Add(charge[h] == 0.0)
                solver.Add(is_charging[h] == 0)

            # Directive: Blocked discharge hours
            if h in scenario.blocked_discharge_hours:
                solver.Add(discharge[h] == 0.0)
                solver.Add(is_discharging[h] == 0)

            # Directive: Grid import caps
            if h in scenario.grid_caps:
                solver.Add(grid[h] <= scenario.grid_caps[h])

            # Energy Balance: grid + solar_used + discharge = demand + charge
            # Rearranged: grid + solar_used + discharge - charge == demand
            solver.Add(
                grid[h] + solar_used[h] + discharge[h] - charge[h] == scenario.demand_kwh[h]
            )

            # Battery State Transition
            if h == 0:
                solver.Add(
                    battery_energy_after[0] == scenario.initial_energy_kwh + charge[0] - discharge[0]
                )
            else:
                solver.Add(
                    battery_energy_after[h] == battery_energy_after[h - 1] + charge[h] - discharge[h]
                )

        # 2. Mandatory End-of-Day Neutrality
        # battery_energy_after[23] == initial_energy_kwh
        solver.Add(battery_energy_after[23] == scenario.initial_energy_kwh)

        # 3. Objective Function
        # Minimize grid import cost, with tiny tie-breakers to prevent battery wear when tariffs are equal
        objective = solver.Objective()
        for h in range(num_hours):
            tariff = scenario.tariff_bdt_per_kwh[h]
            objective.SetCoefficient(grid[h], tariff)
            # 1e-6 micro-penalty to disincentivize idle battery cycling
            objective.SetCoefficient(charge[h], 1e-6)
            objective.SetCoefficient(discharge[h], 1e-6)
        objective.SetMinimization()

        # Execute solve
        status = solver.Solve()

        if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
            status_map = {
                pywraplp.Solver.OPTIMAL: "OPTIMAL",
                pywraplp.Solver.FEASIBLE: "FEASIBLE",
                pywraplp.Solver.INFEASIBLE: "INFEASIBLE",
                pywraplp.Solver.UNBOUNDED: "UNBOUNDED",
                pywraplp.Solver.ABNORMAL: "ABNORMAL",
                pywraplp.Solver.NOT_SOLVED: "NOT_SOLVED",
            }
            status_name = status_map.get(status, f"UNKNOWN_{status}")
            logger.error(f"Energy optimization failed with status: {status_name}")
            return SolverResult(
                success=False,
                status_name=status_name,
                hourly_plan=[],
                total_grid_kwh=0.0,
                total_cost_bdt=0.0,
                peak_grid_kwh=0.0,
                message=f"Optimizer could not find a feasible schedule (status: {status_name}). Verify that grid caps and battery reserves permit meeting demand."
            )

        # Extract solution
        hourly_plan: List[HourlyPlanItem] = []
        total_grid = 0.0
        total_cost = 0.0
        peak_grid = 0.0

        for h in range(num_hours):
            g_val = max(0.0, grid[h].solution_value())
            s_val = max(0.0, solar_used[h].solution_value())
            c_val = max(0.0, charge[h].solution_value())
            d_val = max(0.0, discharge[h].solution_value())
            soc_after = battery_energy_after[h].solution_value()

            # Determine battery action
            if c_val > self.tolerance:
                action = BatteryAction.CHARGE
                battery_kwh = c_val
            elif d_val > self.tolerance:
                action = BatteryAction.DISCHARGE
                battery_kwh = d_val
            else:
                action = BatteryAction.IDLE
                battery_kwh = 0.0

            g_rounded = round_metric(g_val)
            s_rounded = round_metric(s_val)
            b_rounded = round_metric(battery_kwh)
            soc_rounded = round_metric(soc_after)

            total_grid += g_val
            total_cost += g_val * scenario.tariff_bdt_per_kwh[h]
            if g_val > peak_grid:
                peak_grid = g_val

            hourly_plan.append(
                HourlyPlanItem(
                    hour=h,
                    grid_kwh=g_rounded,
                    solar_used_kwh=s_rounded,
                    battery_action=action,
                    battery_kwh=b_rounded,
                    battery_energy_after_kwh=soc_rounded
                )
            )

        return SolverResult(
            success=True,
            status_name="OPTIMAL",
            hourly_plan=hourly_plan,
            total_grid_kwh=round_metric(total_grid),
            total_cost_bdt=round_metric(total_cost),
            peak_grid_kwh=round_metric(peak_grid),
            message="Optimal 24-hour schedule generated successfully."
        )
