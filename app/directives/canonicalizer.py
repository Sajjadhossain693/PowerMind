from typing import List, Optional
from app.schemas import DirectiveInterpretationItem
from app.directives.types import (
    DirectiveType,
    SolarReductionAdjustment,
    MinimumBatteryReserveAdjustment,
    NoChargeWindowAdjustment,
    NoDischargeWindowAdjustment,
    MaxGridWindowAdjustment,
    CanonicalDirective
)

def canonicalize_interpretation(item: DirectiveInterpretationItem) -> CanonicalDirective:
    """Converts a validated interpretation item into a strongly-typed CanonicalDirective."""
    dtype = DirectiveType(item.directive_type)
    if dtype == DirectiveType.NO_OP or not item.applies:
        return CanonicalDirective(
            directive_type=DirectiveType.NO_OP,
            adjustment=None,
            applies=False,
            explanation=item.explanation
        )

    adj_dict = item.structured_adjustment or {}
    adj_model = None

    if dtype == DirectiveType.SOLAR_REDUCTION:
        adj_model = SolarReductionAdjustment(**adj_dict)
    elif dtype == DirectiveType.MINIMUM_BATTERY_RESERVE:
        adj_model = MinimumBatteryReserveAdjustment(**adj_dict)
    elif dtype == DirectiveType.NO_CHARGE_WINDOW:
        adj_model = NoChargeWindowAdjustment(**adj_dict)
    elif dtype == DirectiveType.NO_DISCHARGE_WINDOW:
        adj_model = NoDischargeWindowAdjustment(**adj_dict)
    elif dtype == DirectiveType.MAX_GRID_WINDOW:
        adj_model = MaxGridWindowAdjustment(**adj_dict)

    return CanonicalDirective(
        directive_type=dtype,
        adjustment=adj_model,
        applies=True,
        explanation=item.explanation
    )

def canonicalize_all(items: List[DirectiveInterpretationItem]) -> List[CanonicalDirective]:
    return [canonicalize_interpretation(item) for item in items]
