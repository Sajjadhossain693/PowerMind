from typing import List, Optional
from pydantic import BaseModel
from app.schemas import HourlyPlanItem, BatteryAction

class SolverResult(BaseModel):
    success: bool
    status_name: str
    hourly_plan: List[HourlyPlanItem]
    total_grid_kwh: float
    total_cost_bdt: float
    peak_grid_kwh: float
    message: str = ""
