import time
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from app.schemas import (
    HealthResponse,
    OptimizeEnergyRequest,
    OptimizeEnergyResponse,
    LLMRuntimeConfig
)
from app.services import energy_service
from app.llm.client import create_llm_client
from app.llm.prompts import SYSTEM_PROMPT

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check() -> Dict[str, str]:
    """Lightweight health endpoint conforming strictly to challenge specification."""
    return {"status": "ok"}

@router.post("/optimize-energy", response_model=OptimizeEnergyResponse)
async def optimize_energy_endpoint(request: OptimizeEnergyRequest) -> OptimizeEnergyResponse:
    """
    Canonical Hackathon Endpoint:
    Receives 24h energy scenario + 1-3 operator notes.
    Interprets notes via LLM -> Validates -> Solves via OR-Tools -> Replays -> Returns schedule.
    """
    response, meta = await energy_service.optimize(request)
    return response

@router.post("/api/test-llm")
async def test_llm_connection(config: LLMRuntimeConfig) -> Dict[str, Any]:
    """Tests connectivity and latency for a given LLM model and API key."""
    start = time.time()
    try:
        client = create_llm_client(
            provider=config.provider,
            model=config.model,
            api_key=config.api_key,
            timeout=5.0
        )
        sample_prompt = 'Interpret: ["Rooftop solar maintenance will cut output by half between 13:00 and 15:00."]'
        res = await client.generate(SYSTEM_PROMPT, sample_prompt)
        elapsed_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "success",
            "model": config.model or "mock-deterministic",
            "latency_ms": elapsed_ms,
            "sample_output_preview": res[:150]
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "error",
            "model": config.model,
            "latency_ms": elapsed_ms,
            "error": str(e)
        }

@router.get("/api/credits")
async def get_team_credits() -> Dict[str, Any]:
    """Official hackathon team credits."""
    return {
        "team": "PowerMind Core Engineering",
        "members": [
            {"name": "Pritam Biswas", "github": "https://github.com/pbs002-s"},
            {"name": "Gajiul Islam", "github": "https://github.com/logic-forge119"},
            {"name": "Omar Shihab", "github": "https://github.com/omarshihab1501"},
            {"name": "Sajjad Hossain Siam", "github": "https://github.com/sajjadhossain693"},
        ]
    }

@router.get("/api/scenarios/sample")
async def get_sample_scenario() -> Dict[str, Any]:
    """Provides a realistic 24-hour university campus scenario."""
    # Standard 24-hour university campus profile
    # Solar peaks during midday (hours 9-16)
    # Demand peaks in afternoon and evening (academic + residential halls)
    # Tariff has peak hours (17-23)
    hours = []
    base_demands = [
        35.0, 30.0, 28.0, 28.0, 32.0, 45.0,
        60.0, 80.0, 110.0, 130.0, 140.0, 135.0,
        130.0, 125.0, 120.0, 115.0, 105.0, 120.0,
        145.0, 150.0, 135.0, 110.0, 80.0, 50.0
    ]
    solar_profile = [
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        5.0, 25.0, 60.0, 95.0, 120.0, 130.0,
        125.0, 110.0, 80.0, 45.0, 15.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ]
    # Tariff BDT per kWh: Off-peak=6.5, Normal=9.0, Peak=12.5 (hours 17-22)
    tariffs = [
        6.5, 6.5, 6.5, 6.5, 6.5, 6.5,
        9.0, 9.0, 9.0, 9.0, 9.0, 9.0,
        9.0, 9.0, 9.0, 9.0, 9.0, 12.5,
        12.5, 12.5, 12.5, 12.5, 9.0, 6.5
    ]

    for h in range(24):
        hours.append({
            "hour": h,
            "demand_kwh": base_demands[h],
            "solar_kwh": solar_profile[h],
            "tariff_bdt_per_kwh": tariffs[h]
        })

    return {
        "scenario_id": "bup_campus_summer_peak_01",
        "operator_notes": [
            "PV production will drop to about 20% between 13:00 and 15:00 due to scheduled rooftop array cleaning.",
            "Maintain an emergency battery reserve of at least 120 kWh from 6 PM to 9 PM during the guest convocation lecture.",
            "Do not charge battery from 2 PM to 4 PM while campus substation maintenance is active."
        ],
        "hours": hours,
        "battery": {
            "capacity_kwh": 300.0,
            "initial_energy_kwh": 150.0,
            "minimum_energy_kwh": 50.0,
            "max_charge_kwh_per_hour": 60.0,
            "max_discharge_kwh_per_hour": 60.0
        }
    }
