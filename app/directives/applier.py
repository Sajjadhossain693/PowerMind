from typing import List, Set, Dict, Optional
from pydantic import BaseModel, Field
from app.schemas import HourlyScenarioInput, BatteryConfig
from app.directives.types import (
    DirectiveType,
    CanonicalDirective,
    SolarReductionAdjustment,
    MinimumBatteryReserveAdjustment,
    NoChargeWindowAdjustment,
    NoDischargeWindowAdjustment,
    MaxGridWindowAdjustment
)

class EffectiveScenario(BaseModel):
    """
    Immutable mathematical constraint container consumed by the optimizer.
    Never alters base demand, base tariffs, or base battery capacity.
    """
    hours: List[int] = Field(default_factory=lambda: list(range(24)))
    demand_kwh: List[float]
    original_solar_kwh: List[float]
    effective_solar_kwh: List[float]
    tariff_bdt_per_kwh: List[float]
    
    # Battery parameters
    capacity_kwh: float
    initial_energy_kwh: float
    base_minimum_energy_kwh: float
    dynamic_minimum_energy_kwh: List[float]
    max_charge_kwh_per_hour: float
    max_discharge_kwh_per_hour: float
    
    # Windows
    blocked_charge_hours: Set[int] = Field(default_factory=set)
    blocked_discharge_hours: Set[int] = Field(default_factory=set)
    grid_caps: Dict[int, float] = Field(default_factory=dict)

def build_effective_scenario(
    hours_input: List[HourlyScenarioInput],
    battery_config: BatteryConfig,
    directives: List[CanonicalDirective]
) -> EffectiveScenario:
    """
    Applies canonical directives onto the baseline 24-hour scenario to produce
    the EffectiveScenario for the optimizer.
    Deterministic conflict resolution:
    - Multiple reserves: max()
    - Multiple grid caps: min()
    - Multiple solar reductions on same hour: min() (strictest factor)
    - Overlapping charge/discharge blocks: union of sets
    """
    # Sort hours 0..23
    sorted_hours = sorted(hours_input, key=lambda x: x.hour)
    
    demand = [h.demand_kwh for h in sorted_hours]
    orig_solar = [h.solar_kwh for h in sorted_hours]
    tariffs = [h.tariff_bdt_per_kwh for h in sorted_hours]
    
    effective_solar = list(orig_solar)
    dynamic_reserves = [battery_config.minimum_energy_kwh] * 24
    blocked_charge: Set[int] = set()
    blocked_discharge: Set[int] = set()
    grid_caps: Dict[int, float] = {}

    for d in directives:
        if not d.applies or d.adjustment is None:
            continue

        if d.directive_type == DirectiveType.SOLAR_REDUCTION:
            adj: SolarReductionAdjustment = d.adjustment  # type: ignore
            for h in adj.hours:
                # Apply reduction factor. If multiple reductions, take strictest factor
                current_reduction_factor = effective_solar[h] / orig_solar[h] if orig_solar[h] > 0 else 1.0
                strictest_factor = min(current_reduction_factor, adj.factor)
                effective_solar[h] = orig_solar[h] * strictest_factor

        elif d.directive_type == DirectiveType.MINIMUM_BATTERY_RESERVE:
            adj: MinimumBatteryReserveAdjustment = d.adjustment  # type: ignore
            for h in adj.hours:
                # Take strongest reserve, bounded by battery capacity
                bounded_reserve = min(adj.minimum_energy_kwh, battery_config.capacity_kwh)
                dynamic_reserves[h] = max(dynamic_reserves[h], bounded_reserve)

        elif d.directive_type == DirectiveType.NO_CHARGE_WINDOW:
            adj: NoChargeWindowAdjustment = d.adjustment  # type: ignore
            blocked_charge.update(adj.hours)

        elif d.directive_type == DirectiveType.NO_DISCHARGE_WINDOW:
            adj: NoDischargeWindowAdjustment = d.adjustment  # type: ignore
            blocked_discharge.update(adj.hours)

        elif d.directive_type == DirectiveType.MAX_GRID_WINDOW:
            adj: MaxGridWindowAdjustment = d.adjustment  # type: ignore
            for h in adj.hours:
                if h in grid_caps:
                    grid_caps[h] = min(grid_caps[h], adj.max_grid_kwh)
                else:
                    grid_caps[h] = adj.max_grid_kwh

    return EffectiveScenario(
        hours=list(range(24)),
        demand_kwh=demand,
        original_solar_kwh=orig_solar,
        effective_solar_kwh=effective_solar,
        tariff_bdt_per_kwh=tariffs,
        capacity_kwh=battery_config.capacity_kwh,
        initial_energy_kwh=battery_config.initial_energy_kwh,
        base_minimum_energy_kwh=battery_config.minimum_energy_kwh,
        dynamic_minimum_energy_kwh=dynamic_reserves,
        max_charge_kwh_per_hour=battery_config.max_charge_kwh_per_hour,
        max_discharge_kwh_per_hour=battery_config.max_discharge_kwh_per_hour,
        blocked_charge_hours=blocked_charge,
        blocked_discharge_hours=blocked_discharge,
        grid_caps=grid_caps
    )
