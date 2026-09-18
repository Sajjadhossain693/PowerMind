from typing import List
from app.schemas import DirectiveInterpretationItem
from app.directives.types import DirectiveType

class DirectiveValidationError(Exception):
    pass

def validate_interpretations(
    interpretations: List[DirectiveInterpretationItem],
    expected_count: int,
    battery_capacity_kwh: float
) -> None:
    """
    Validates that interpretation list conforms to deterministic rules:
    - 0-indexed sequential note_index
    - no_op has applies=False, adjustment=None
    - other directives have applies=True and valid adjustment
    - hours are 0..23, unique, ascending
    """
    if len(interpretations) != expected_count:
        raise DirectiveValidationError(
            f"Expected {expected_count} interpretations, got {len(interpretations)}"
        )

    for idx, item in enumerate(interpretations):
        if item.note_index != idx:
            raise DirectiveValidationError(
                f"Interpretation index mismatch: expected {idx}, got {item.note_index}"
            )

        try:
            dtype = DirectiveType(item.directive_type)
        except ValueError:
            raise DirectiveValidationError(f"Unsupported directive type: {item.directive_type}")

        if dtype == DirectiveType.NO_OP:
            if item.applies:
                raise DirectiveValidationError("no_op directive must have applies=False")
            if item.structured_adjustment is not None:
                raise DirectiveValidationError("no_op directive must have structured_adjustment=None")
        else:
            if not item.applies:
                raise DirectiveValidationError(f"Directive {dtype.value} must have applies=True")
            if item.structured_adjustment is None:
                raise DirectiveValidationError(f"Directive {dtype.value} requires structured_adjustment")

            hours = item.structured_adjustment.get("hours", [])
            if not hours or not isinstance(hours, list):
                raise DirectiveValidationError(f"Directive {dtype.value} must have non-empty 'hours' list")

            # Check unique, integer, in range 0..23, and sorted
            for h in hours:
                if not isinstance(h, int) or h < 0 or h > 23:
                    raise DirectiveValidationError(f"Invalid hour {h} in {dtype.value}")
            if hours != sorted(list(set(hours))):
                raise DirectiveValidationError(f"Hours must be unique and sorted ascending in {dtype.value}")

            if dtype == DirectiveType.SOLAR_REDUCTION:
                factor = item.structured_adjustment.get("factor")
                if factor is None or not (0.0 <= factor <= 1.0):
                    raise DirectiveValidationError(f"solar_reduction factor must be between 0 and 1, got {factor}")
            elif dtype == DirectiveType.MINIMUM_BATTERY_RESERVE:
                res = item.structured_adjustment.get("minimum_energy_kwh")
                if res is None or res < 0.0 or res > battery_capacity_kwh:
                    raise DirectiveValidationError(
                        f"minimum_battery_reserve {res} must be between 0 and battery capacity {battery_capacity_kwh}"
                    )
            elif dtype == DirectiveType.MAX_GRID_WINDOW:
                cap = item.structured_adjustment.get("max_grid_kwh")
                if cap is None or cap < 0.0:
                    raise DirectiveValidationError(f"max_grid_kwh must be non-negative, got {cap}")
