from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, field_validator

class DirectiveType(str, Enum):
    SOLAR_REDUCTION = "solar_reduction"
    MINIMUM_BATTERY_RESERVE = "minimum_battery_reserve"
    NO_CHARGE_WINDOW = "no_charge_window"
    NO_DISCHARGE_WINDOW = "no_discharge_window"
    MAX_GRID_WINDOW = "max_grid_window"
    NO_OP = "no_op"

class SolarReductionAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Hours where solar reduction applies (0..23)")
    factor: float = Field(..., ge=0.0, le=1.0, description="Multiplier for solar output between 0 and 1")

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("hours list cannot be empty")
        for h in v:
            if not isinstance(h, int) or h < 0 or h > 23:
                raise ValueError(f"Hour {h} must be an integer between 0 and 23")
        return sorted(list(set(v)))

class MinimumBatteryReserveAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Hours where battery reserve applies (0..23)")
    minimum_energy_kwh: float = Field(..., ge=0.0, description="Minimum battery reserve in kWh")

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("hours list cannot be empty")
        for h in v:
            if not isinstance(h, int) or h < 0 or h > 23:
                raise ValueError(f"Hour {h} must be an integer between 0 and 23")
        return sorted(list(set(v)))

class NoChargeWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Hours where charging is forbidden")

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("hours list cannot be empty")
        for h in v:
            if not isinstance(h, int) or h < 0 or h > 23:
                raise ValueError(f"Hour {h} must be an integer between 0 and 23")
        return sorted(list(set(v)))

class NoDischargeWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Hours where discharging is forbidden")

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("hours list cannot be empty")
        for h in v:
            if not isinstance(h, int) or h < 0 or h > 23:
                raise ValueError(f"Hour {h} must be an integer between 0 and 23")
        return sorted(list(set(v)))

class MaxGridWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Hours where grid import is capped")
    max_grid_kwh: float = Field(..., ge=0.0, description="Max grid import in kWh")

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("hours list cannot be empty")
        for h in v:
            if not isinstance(h, int) or h < 0 or h > 23:
                raise ValueError(f"Hour {h} must be an integer between 0 and 23")
        return sorted(list(set(v)))

StructuredAdjustment = Union[
    SolarReductionAdjustment,
    MinimumBatteryReserveAdjustment,
    NoChargeWindowAdjustment,
    NoDischargeWindowAdjustment,
    MaxGridWindowAdjustment,
    None
]

class CanonicalDirective(BaseModel):
    directive_type: DirectiveType
    adjustment: Optional[BaseModel] = None
    applies: bool = True
    explanation: str = ""
