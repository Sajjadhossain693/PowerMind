import math
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator
from app.directives.types import DirectiveType

class BatteryAction(str, Enum):
    CHARGE = "charge"
    DISCHARGE = "discharge"
    IDLE = "idle"

class HourlyScenarioInput(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour index from 0 to 23")
    demand_kwh: float = Field(..., ge=0.0, description="Demand in kWh")
    solar_kwh: float = Field(..., ge=0.0, description="Solar generation in kWh")
    tariff_bdt_per_kwh: float = Field(..., ge=0.0, description="Tariff in BDT per kWh")

    @field_validator("demand_kwh", "solar_kwh", "tariff_bdt_per_kwh")
    @classmethod
    def check_finite(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Values must be finite non-negative numbers")
        return float(v)

class BatteryConfig(BaseModel):
    capacity_kwh: float = Field(..., gt=0.0, description="Total battery capacity in kWh")
    initial_energy_kwh: float = Field(..., ge=0.0, description="Initial battery state of charge in kWh")
    minimum_energy_kwh: float = Field(..., ge=0.0, description="Base minimum energy reserve in kWh")
    max_charge_kwh_per_hour: float = Field(..., ge=0.0, description="Max charge rate in kWh/hour")
    max_discharge_kwh_per_hour: float = Field(..., ge=0.0, description="Max discharge rate in kWh/hour")

    @model_validator(mode="after")
    def validate_relationships(self) -> "BatteryConfig":
        if self.initial_energy_kwh > self.capacity_kwh:
            raise ValueError("initial_energy_kwh cannot exceed capacity_kwh")
        if self.minimum_energy_kwh > self.capacity_kwh:
            raise ValueError("minimum_energy_kwh cannot exceed capacity_kwh")
        if self.initial_energy_kwh < self.minimum_energy_kwh:
            raise ValueError("initial_energy_kwh cannot be less than minimum_energy_kwh")
        return self

class LLMRuntimeConfig(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

class OptimizeEnergyRequest(BaseModel):
    scenario_id: str = Field(..., min_length=1, description="Unique scenario identifier")
    operator_notes: List[str] = Field(..., min_length=1, max_length=3, description="1 to 3 operator natural language notes")
    hours: List[HourlyScenarioInput] = Field(..., description="Exactly 24 hourly scenario items")
    battery: BatteryConfig = Field(..., description="Battery configuration")
    llm_config: Optional[LLMRuntimeConfig] = Field(default=None, description="Optional runtime LLM provider/key override for UI")

    @field_validator("operator_notes")
    @classmethod
    def validate_notes(cls, v: List[str]) -> List[str]:
        if not (1 <= len(v) <= 3):
            raise ValueError("operator_notes must contain between 1 and 3 items")
        for i, note in enumerate(v):
            if not isinstance(note, str) or not note.strip():
                raise ValueError(f"Note at index {i} must be a non-empty string")
        return v

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: List[HourlyScenarioInput]) -> List[HourlyScenarioInput]:
        if len(v) != 24:
            raise ValueError(f"Exactly 24 hours required, got {len(v)}")
        
        seen_hours = set()
        for h in v:
            if h.hour in seen_hours:
                raise ValueError(f"Duplicate hour found: {h.hour}")
            seen_hours.add(h.hour)
            
        if seen_hours != set(range(24)):
            raise ValueError("Hours must contain all integers from 0 to 23 inclusive")
            
        # Return sorted by hour index
        return sorted(v, key=lambda x: x.hour)

class DirectiveInterpretationItem(BaseModel):
    note_index: int = Field(..., ge=0, description="0-based index matching operator_notes")
    applies: bool = Field(..., description="True if directive applies, False for no_op")
    directive_type: str = Field(..., description="One of the 6 canonical directive types")
    structured_adjustment: Optional[Dict[str, Any]] = Field(default=None, description="Structured adjustment or null")
    explanation: str = Field(..., description="Reasoning or description for the interpretation")

class HourlyPlanItem(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    grid_kwh: float = Field(..., ge=0.0)
    solar_used_kwh: float = Field(..., ge=0.0)
    battery_action: BatteryAction
    battery_kwh: float = Field(..., ge=0.0)
    battery_energy_after_kwh: float = Field(..., ge=0.0)

class OptimizeEnergyResponse(BaseModel):
    scenario_id: str
    directive_interpretation: List[DirectiveInterpretationItem]
    hourly_plan: List[HourlyPlanItem]
    total_grid_kwh: float
    total_cost_bdt: float
    peak_grid_kwh: float
    plan_summary: str

class HealthResponse(BaseModel):
    status: str = "ok"
