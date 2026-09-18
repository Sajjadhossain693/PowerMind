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

AVAILABLE_MODELS = {
    "gemini": [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "recommended": True, "description": "High intelligence & fast response"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "recommended": False, "description": "Maximum reasoning capability"},
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "recommended": False, "description": "Next-gen low latency"},
        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "recommended": False, "description": "Balanced speed and efficiency"}
    ],
    "openai": [
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "recommended": True, "description": "Fast and lightweight"},
        {"id": "gpt-4o", "name": "GPT-4o", "recommended": False, "description": "Flagship multi-modal model"},
        {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "recommended": False, "description": "Legacy fast model"}
    ],
    "groq": [
        {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile", "recommended": True, "description": "Ultra-fast inference"},
        {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant", "recommended": False, "description": "Sub-100ms response time"},
        {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "recommended": False, "description": "MoE architecture"}
    ],
    "openrouter": [
        {"id": "meta-llama/llama-3.3-70b-instruct", "name": "Llama 3.3 70B", "recommended": True, "description": "Open-weight flagship via OpenRouter"},
        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "recommended": False, "description": "Leading reasoning performance"},
        {"id": "deepseek/deepseek-chat", "name": "DeepSeek V3", "recommended": False, "description": "High performance open model"}
    ],
    "anthropic": [
        {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "recommended": True, "description": "Advanced reasoning & guardrails"},
        {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku", "recommended": False, "description": "Ultra-fast intelligent responses"}
    ],
    "mock": [
        {"id": "local-trained-model", "name": "Local Trained ML Model (Offline)", "recommended": True, "description": "Zero external dependencies, trained on campus cases"},
        {"id": "mock-deterministic", "name": "Deterministic Heuristic Engine", "recommended": False, "description": "Rule-based instant fallback"}
    ]
}

@router.get("/api/models/available")
async def get_available_models() -> Dict[str, Any]:
    """Catalog of supported models and recommendations per provider."""
    return AVAILABLE_MODELS

@router.get("/api/scenarios/cases")
async def get_benchmark_cases() -> List[Dict[str, Any]]:
    """Returns curated benchmark campus scenarios from the dataset."""
    import os, json
    cases_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json")
    if os.path.exists(cases_path):
        try:
            with open(cases_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            cases = []
            for c in data.get("cases", []):
                cases.append({
                    "id": c.get("id"),
                    "label": c.get("label"),
                    "rationale": c.get("rationale", ""),
                    "input": c.get("input")
                })
            return cases
        except Exception:
            pass
    return []

@router.get("/health", response_model=HealthResponse)
async def health_check() -> Dict[str, str]:
    """Lightweight health endpoint."""
    return {"status": "ok"}

@router.post("/optimize-energy", response_model=OptimizeEnergyResponse)
async def optimize_energy_endpoint(request: OptimizeEnergyRequest) -> OptimizeEnergyResponse:
    """
    Production Autonomous Energy Scheduling Endpoint:
    Receives 24h energy scenario + 1-3 operator notes.
    Interprets notes via LLM -> Validates -> Solves via OR-Tools -> Replays -> Returns schedule.
    """
    response, meta = await energy_service.optimize(request)
    return response

@router.post("/api/agent/prompt")
async def agent_prompt_endpoint(request: Dict[str, Any]) -> Dict[str, Any]:
    """Executes natural language campus energy commands via the Inbuilt AI Agent."""
    from app.agent import AgentPromptRequest, execute_agent_prompt
    agent_req = AgentPromptRequest(**request)
    result = await execute_agent_prompt(agent_req)
    return result.model_dump()

@router.post("/api/chat")
async def chat_endpoint(request: Dict[str, Any]) -> Dict[str, Any]:
    """Answers operator questions regarding campus energy schedules, tariffs, and directives."""
    from app.chatbot import ChatRequest, handle_chat_query
    chat_req = ChatRequest(**request)
    result = await handle_chat_query(chat_req)
    return result.model_dump()

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
    """PowerMind Core Engineering Team Credits."""
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
        "scenario_id": "campus_summer_peak_01",
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
