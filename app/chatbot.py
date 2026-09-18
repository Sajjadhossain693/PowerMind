"""
PowerMind Intelligent Campus Energy Chatbot
Provides real-time conversational Q&A for energy optimization schedules,
battery dispatch logic, tariff arbitrage, and operational constraints.
"""
import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from app.llm.client import create_llm_client

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    scenario_context: Optional[Dict[str, Any]] = None
    llm_config: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    reply: str
    source: str  # "llm" or "local_engine"

def generate_local_reply(query: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Intelligent local domain assistant that analyzes the active scenario context
    and answers operational energy questions offline with zero API calls.
    """
    q = query.lower()
    ctx = context or {}
    results = ctx.get("results") or {}
    hourly_plan = results.get("hourly_plan") or []
    cost = results.get("total_cost_bdt")
    peak = results.get("peak_grid_kwh")
    grid_total = results.get("total_grid_kwh")
    scenario_id = ctx.get("scenario_id", "campus_smart_grid_01")

    # 1. Battery discharge / charge timing inquiry
    if ("charge" in q or "discharge" in q or "battery" in q) and any(k in q for k in ["why", "when", "how", "action", "decision", "reason", "hour", "logic", "strategy"]):
        charge_hours = [p.get("hour") for p in hourly_plan if p.get("battery_action") == "charge"]
        discharge_hours = [p.get("hour") for p in hourly_plan if p.get("battery_action") == "discharge"]
        
        reply = (
            "Battery Dispatch Strategy:\n"
            f"- Charging Windows: Hours {charge_hours} during low-tariff off-peak periods (typically 6.5 BDT/kWh) or excess solar generation.\n"
            f"- Discharging Windows: Hours {discharge_hours} during peak-tariff evening windows (12.5 BDT/kWh).\n"
            "This economic arbitrage minimizes campus utility expenses while honoring inverter throughput rate limits."
        )
        return reply

    # 2. Cost / Expenditure / Savings
    if any(k in q for k in ["cost", "expense", "bill", "money", "tariff", "savings"]):
        if cost is not None:
            return (
                f"Scenario '{scenario_id}' Financial Overview:\n"
                f"- Total Electricity Expenditure: BDT {cost:.2f}\n"
                f"- Peak Grid Import: {peak:.1f} kWh\n"
                f"- Total Grid Import: {grid_total:.1f} kWh\n"
                "The schedule was mathematically solved via mixed-integer linear programming (MILP) to achieve the global minimum cost."
            )
        return "The optimizer solves energy dispatch to minimize electricity expenditure against time-of-use tariffs, prioritizing solar self-consumption and battery arbitrage during peak hours."

    # 3. End-of-Day Neutrality
    if any(k in q for k in ["neutrality", "soc", "end of day", "soc23", "soc 23", "battery reserve"]):
        return (
            "End-of-Day Battery Neutrality Guarantee:\n"
            "PowerMind enforces a hard mathematical constraint: SOC[23] = SOC[0].\n"
            "At 23:00 (the 24th hour), the battery state of charge must exactly match its initial morning level. "
            "This prevents unsustainable battery depletion and ensures identical operational readiness for the next 24-hour cycle."
        )

    # 4. Solar reduction directive
    if any(k in q for k in ["solar reduction", "solar factor", "pv clean", "solar dip"]):
        return (
            "Solar Reduction Directive (solar_reduction):\n"
            "When natural language notes specify maintenance or cloud cover, PowerMind computes the usable fraction ('factor'). "
            "For example, an 80% solar reduction maps to factor = 0.20 for the specified hours. "
            "The optimizer enforces that solar consumption cannot exceed this adjusted physical ceiling."
        )

    # 5. Directives overview
    if any(k in q for k in ["directive", "constraint", "rules", "what can i ask", "commands"]):
        return (
            "Supported Directives:\n"
            "1. solar_reduction: Reduces usable solar generation by a fraction or percentage during specific hours.\n"
            "2. minimum_battery_reserve: Raises the minimum battery energy floor (kWh) for emergency resilience.\n"
            "3. no_charge_window: Forbids battery charging during maintenance or transformer testing.\n"
            "4. no_discharge_window: Forbids battery discharging to protect reserves.\n"
            "5. max_grid_window: Caps peak utility import from the feeder.\n"
            "6. no_op: Filters out non-operational campus announcements."
        )

    # 6. Peak grid import / Feeder cap
    if any(k in q for k in ["peak", "grid cap", "feeder", "transformer"]):
        if peak is not None:
            return f"The current peak grid import is {peak:.1f} kWh. You can impose a feeder cap note such as 'Cap grid import to 50 kWh between 18:00 and 20:00' to enforce load shaving."
        return "Peak grid demand is tracked hourly. You can set feeder caps by adding an operator directive like 'Cap grid import to 60 kWh between 18:00 and 21:00'."

    # 7. Model configuration / API keys
    if any(k in q for k in ["api key", "provider", "model", "gemini", "groq", "openai"]):
        return (
            "LLM Provider Setup:\n"
            "Click the Settings button in the top navbar. Select your provider (Google Gemini, OpenAI, Groq, OpenRouter, or Local Trained ML). "
            "Enter your API key and click 'Save Settings'. If no key is provided, PowerMind runs 100% offline using the local trained ML model."
        )

    # Default fallback
    return (
        "PowerMind Smart Campus Energy Assistant:\n"
        "I can explain 24-hour dispatch schedules, tariff arbitrage decisions, battery charge/discharge windows, "
        "and physical invariants. Try asking:\n"
        "- 'Why did the battery charge or discharge?'\n"
        "- 'What is the total cost and peak import?'\n"
        "- 'Explain end-of-day battery neutrality'\n"
        "- 'What directives are supported?'"
    )

async def handle_chat_query(request: ChatRequest) -> ChatResponse:
    """
    Processes chat message using configured external LLM if available,
    or returns high-accuracy offline domain reasoning.
    """
    cfg = request.llm_config or {}
    provider = (cfg.get("provider") or "").strip().lower()
    api_key = (cfg.get("api_key") or "").strip()
    model = (cfg.get("model") or "").strip()

    # If external provider configured with real API key
    if provider in ("gemini", "openai", "groq", "openrouter") and api_key and "your_" not in api_key:
        try:
            client = create_llm_client(
                provider=provider,
                model=model,
                api_key=api_key,
                timeout=6.0
            )
            ctx = request.scenario_context or {}
            system_prompt = (
                "You are the PowerMind Smart Campus Energy AI Assistant. "
                "Answer operator questions concisely, accurately, and professionally. "
                "Do NOT use any emojis in your response. "
                f"Active Scenario Context: {str(ctx)[:1000]}"
            )
            reply = await client.generate(system_prompt, request.message)
            if reply and len(reply.strip()) > 5:
                # Remove any stray emojis from external model output
                clean_reply = re.sub(r"[^\x00-\x7F]+", "", reply)
                return ChatResponse(reply=clean_reply.strip() or reply.strip(), source="llm")
        except Exception:
            # Graceful fallback to local engine on API error
            pass

    # Use offline local domain engine
    local_reply = generate_local_reply(request.message, request.scenario_context)
    return ChatResponse(reply=local_reply, source="local_engine")
