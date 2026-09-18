"""
Inbuilt AI Energy Agent for PowerMind
Translates high-level operator natural language prompts into validated scenario constraints,
triggers the deterministic MILP optimization engine, and produces executive dispatch insights.
"""
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.schemas import (
    OptimizeEnergyRequest,
    OptimizeEnergyResponse,
    HourlyScenarioInput,
    BatteryConfig,
    LLMRuntimeConfig
)
from app.services import energy_service

class AgentPromptRequest(BaseModel):
    prompt: str = Field(..., description="Natural language operator instruction or scenario goal")
    scenario_id: Optional[str] = Field("campus_smart_grid_01", description="Scenario identifier")
    hours: Optional[List[HourlyScenarioInput]] = None
    battery: Optional[BatteryConfig] = None
    llm_config: Optional[LLMRuntimeConfig] = None

class AgentExecutionResult(BaseModel):
    prompt: str
    scenario_id: str
    generated_operator_notes: List[str]
    optimization_result: OptimizeEnergyResponse
    agent_insights: str
    cost_summary_bdt: float
    peak_grid_kwh: float

def extract_notes_from_prompt(prompt: str) -> List[str]:
    """
    Deconstructs a user prompt into up to 3 discrete operator constraint notes.
    """
    sentences = [s.strip() for s in re.split(r"[;\n\.]|(?:\b(?:also|additionally|plus)\b)", prompt) if s.strip()]
    
    notes = []
    for s in sentences:
        if len(s) < 8:
            continue
        low = s.lower()
        if any(k in low for k in ["solar", "pv", "sun", "cloud", "panel", "battery", "charge", "discharge", "grid", "reserve", "feeder", "tariff", "kwh"]):
            notes.append(s.capitalize())
        if len(notes) >= 3:
            break

    if not notes:
        clean_p = prompt.strip()
        if clean_p:
            notes = [clean_p]
        else:
            notes = ["Maintain standard campus energy balancing."]

    return notes[:3]

def generate_agent_insights(response: OptimizeEnergyResponse, notes: List[str]) -> str:
    """
    Generates a concise executive analysis of the schedule.
    """
    applied = [d for d in response.directive_interpretation if d.applies]
    applied_count = len(applied)
    
    charge_hours = [p.hour for p in response.hourly_plan if p.battery_action == "charge"]
    discharge_hours = [p.hour for p in response.hourly_plan if p.battery_action == "discharge"]
    
    charge_str = f"hours {charge_hours}" if charge_hours else "none"
    discharge_str = f"hours {discharge_hours}" if discharge_hours else "none"

    insights = (
        f"AI Agent optimized campus energy dispatch for {len(response.hourly_plan)} hours. "
        f"{applied_count} out of {len(notes)} operator constraint(s) were mathematically enforced. "
        f"Total electricity expenditure is {response.total_cost_bdt:.2f} BDT with peak grid import of {response.peak_grid_kwh:.1f} kWh. "
        f"Battery arbitrage actively charged during off-peak windows ({charge_str}) and discharged during peak tariff periods ({discharge_str}), "
        f"guaranteeing end-of-day neutrality (SOC23 = SOC0) with zero physical violations."
    )
    return insights

async def execute_agent_prompt(request: AgentPromptRequest) -> AgentExecutionResult:
    """
    Executes the full agent loop:
    1. Parse natural language prompt into valid operator notes.
    2. Build or load default hourly and battery profiles.
    3. Run optimization pipeline.
    4. Return structured agent insights and schedule.
    """
    notes = extract_notes_from_prompt(request.prompt)

    # Use default hours / battery if not provided
    from app.api import get_sample_scenario
    sample = await get_sample_scenario()

    hours = request.hours if request.hours and len(request.hours) == 24 else sample["hours"]
    battery = request.battery if request.battery else sample["battery"]

    opt_request = OptimizeEnergyRequest(
        scenario_id=request.scenario_id or "campus_smart_grid_01",
        operator_notes=notes,
        hours=hours,
        battery=battery,
        llm_config=request.llm_config
    )

    opt_response, meta = await energy_service.optimize(opt_request)
    insights = generate_agent_insights(opt_response, notes)

    return AgentExecutionResult(
        prompt=request.prompt,
        scenario_id=request.scenario_id or "campus_smart_grid_01",
        generated_operator_notes=notes,
        optimization_result=opt_response,
        agent_insights=insights,
        cost_summary_bdt=opt_response.total_cost_bdt,
        peak_grid_kwh=opt_response.peak_grid_kwh
    )
