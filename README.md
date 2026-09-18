# PowerMind — Smart Campus Energy Optimization Engine

> Production-Grade Autonomous Energy Scheduling API & Optimization Dashboard

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![OR-Tools](https://img.shields.io/badge/Google%20OR--Tools-MILP-orange.svg)](https://developers.google.com/optimization)
[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-brightgreen.svg)](tests/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)

---

## Engineering Team Credits

Developed and engineered by:

- **Pritam Biswas** — [GitHub Profile](https://github.com/pbs002-s) — *Core Architect & Backend Lead*
- **Gajiul Islam** — [GitHub Profile](https://github.com/logic-forge119) — *Optimizer & Mathematical Modeling Lead*
- **Omar Shihab** — [GitHub Profile](https://github.com/omarshihab1501) — *LLM & Guardrails Systems Engineer*
- **Sajjad Hossain Siam** — [GitHub Profile](https://github.com/sajjadhossain693) — *Verification, QA & Full-Stack Engineer*

---

## Core Architectural Principle

> **"The LLM interprets language; deterministic code validates intent; the mathematical optimizer makes the energy decision."**

The LLM is **never** trusted to generate numerical schedules directly. Instead, PowerMind enforces an uncompromising zero-trust boundary:
1. **Operator Language**: Natural-language notes (e.g. maintenance, guest lectures, feeder caps).
2. **LLM Interpreter**: Provider-agnostic engine (Google Gemini, OpenAI, Groq, OpenRouter, Local Trained ML, or Deterministic Mock) converts notes into structured JSON.
3. **Deterministic Guardrails & Canonicalizer**: Validates types, ensures 1-to-1 sequential mapping, converts time ranges (inclusive start, exclusive end), applies percentage conversions, and builds mathematical constraints (`EffectiveScenario`).
4. **Google OR-Tools MILP**: Solves the 24-hour campus energy schedule for minimal electricity cost while strictly enforcing energy balance, inverter rate limits, dynamic battery reserves, and **mandatory end-of-day battery neutrality** ($SOC_{23} = SOC_{\text{initial}}$).
5. **Independent Replay Validator**: Evaluates 13 separate physical and policy invariants independently before returning any solution to the client.

---

## Live Benchmark Performance

Measured locally using `scripts/benchmark.py` on 24-hour university campus scenarios:

| Metric | Measured Value | Production SLA Target | Status |
| :--- | :--- | :--- | :--- |
| **Success Rate** | **100.0%** (30/30) | $\ge 99.0\%$ | **PASS** |
| **Throughput** | **84.17 req/sec** | $\ge 10\text{ req/s}$ | **PASS** |
| **p50 Latency** | **10.59 ms** | $\le 2000\text{ ms}$ | **PASS** |
| **p95 Latency** | **30.68 ms** | $\le 5000\text{ ms}$ | **PASS** |
| **p99 Latency** | **30.68 ms** | $\le 5000\text{ ms}$ | **PASS** |
| **Max Latency** | **48.36 ms** | $\le 8000\text{ ms}$ | **PASS** |

---

## Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.11 or Python 3.12
- Node.js 18+ (for frontend development)

### 2. Clone & Environment Setup
```bash
# Clone the repository
git clone https://github.com/pbs002-s/powermind-gridwise-llm.git
cd powermind-gridwise-llm

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` as desired:
```env
APP_NAME=PowerMind
ENV=production
LLM_PROVIDER=gemini        # Options: gemini, openai, groq, openrouter, mock
LLM_MODEL=gemini-2.5-flash
LLM_API_KEY=your_api_key_here
SOLVER_TIMEOUT_SECONDS=10.0
```
*(Note: If `LLM_API_KEY` is not provided, PowerMind automatically utilizes its built-in deterministic mock engine with zero latency).*

### 4. Run the Application
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser at:
- **Interactive UI Dashboard**: [http://localhost:8000/](http://localhost:8000/)
- **FastAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Docker Production Deployment

### Build & Run Container
```bash
# Build the Docker image
docker build -t powermind:latest .

# Run container with port 8000
docker run -d --name powermind-app -p 8000:8000 --env-file .env powermind:latest
```

### Using Docker Compose
```bash
docker compose up -d
```

Verify container health:
```bash
curl http://localhost:8000/health
# Response: {"status":"ok"}
```

---

## Comprehensive Verification Suite

Run all automated checks in one command:
```bash
python scripts/run_all_checks.py
```
This executes:
1. **Pytest Suite** (30/30 unit, integration, schema, and adversarial tests).
2. **Benchmark Smoke Test** (p50/p95 latency audit).
3. **Secret & Security Audit** (verifies zero committed tokens/credentials).

Run unit tests directly:
```bash
pytest -v
```

Run latency benchmark:
```bash
python scripts/benchmark.py 50
```

---

## API Contract Specification

### 1. `GET /health`
- **Response**: HTTP 200
```json
{
  "status": "ok"
}
```

### 2. `POST /optimize-energy`
- **Request Body**:
```json
{
  "scenario_id": "bup_benchmark_001",
  "operator_notes": [
    "Expect an 80% reduction in rooftop solar during the 1-3 PM maintenance window.",
    "Maintain an emergency battery reserve of at least 100 kWh between 18:00 and 21:00.",
    "Do not charge the battery from 2 PM to 4 PM while the main transformer is inspected."
  ],
  "hours": [
    {"hour": 0, "demand_kwh": 30.0, "solar_kwh": 0.0, "tariff_bdt_per_kwh": 6.5},
    {"hour": 1, "demand_kwh": 28.0, "solar_kwh": 0.0, "tariff_bdt_per_kwh": 6.5},
    "... exactly 24 hourly objects ..."
  ],
  "battery": {
    "capacity_kwh": 250.0,
    "initial_energy_kwh": 120.0,
    "minimum_energy_kwh": 40.0,
    "max_charge_kwh_per_hour": 50.0,
    "max_discharge_kwh_per_hour": 50.0
  }
}
```

- **Response Body**:
```json
{
  "scenario_id": "bup_benchmark_001",
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": {"hours": [13, 14], "factor": 0.2},
      "explanation": "Solar reduction applied with factor 0.2 during hours [13, 14]."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "minimum_battery_reserve",
      "structured_adjustment": {"hours": [18, 19, 20], "minimum_energy_kwh": 100.0},
      "explanation": "Maintain minimum battery reserve of 100.0 kWh during hours [18, 19, 20]."
    },
    {
      "note_index": 2,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": {"hours": [14, 15]},
      "explanation": "Battery charging forbidden during hours [14, 15]."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 30.0,
      "solar_used_kwh": 0.0,
      "battery_action": "idle",
      "battery_kwh": 0.0,
      "battery_energy_after_kwh": 120.0
    }
  ],
  "total_grid_kwh": 1130.0,
  "total_cost_bdt": 11135.0,
  "peak_grid_kwh": 130.0,
  "plan_summary": "Optimized 24-hour schedule for scenario 'bup_benchmark_001'..."
}
```

---

## UI Dashboard Features

1. **Model & API Key Configurator**: Users can choose their provider (Google Gemini, OpenAI, Groq, OpenRouter, or Mock) and input their API key directly in the web UI. Keys persist in browser storage.
2. **Connectivity Latency Tester**: Instant test call to verify external API keys and measure provider round-trip time.
3. **Pipeline Flow Indicator**: Clearly highlights where the LLM is used vs where deterministic math algorithms run.
4. **Interactive 24-Hour Dispatch Chart**: Stacked visualization of Campus Demand, Solar Generation, Battery Charge/Discharge, and Grid Import.
5. **Battery SOC Trajectory**: Visual confirmation of minimum reserves and end-of-day battery neutrality.
6. **Data Export**: 1-click download of the complete response in JSON or CSV format, plus Print/PDF report generation.
7. **Team Credits Modal**: Direct links to all four engineers' GitHub profiles.
8. **Inbuilt AI Energy Agent**: Natural language prompt execution for automated scenario formulation.
9. **Interactive Chatbot**: Instant Q&A answering operator questions regarding schedules, battery dispatch, and tariffs.

---

## Technical Demo Script

- **0:00 – 0:30 (The Problem)**: Fluctuating university tariffs, rooftop solar variability, and human operators communicating constraints in informal natural language.
- **0:30 – 1:00 (The Architecture)**: Explaining why LLMs must never produce schedules directly, and how PowerMind pairs an LLM semantic layer with Google OR-Tools.
- **1:00 – 1:40 (LLM & Guardrails)**: Showing note interpretation, inclusive-start/exclusive-end time parsing, factor extraction (e.g. "one fifth" or "80% reduction" -> 0.2), and bounded repair.
- **1:40 – 2:20 (Live API & Dashboard Demo)**: Running the smart campus benchmark scenario in the web dashboard; observing peak shaving and battery charge shifting.
- **2:20 – 2:45 (Independent Replay Validator)**: Demonstrating how 13 physical invariants and end-of-day neutrality ($SOC_{23} = SOC_0$) are rigorously verified before returning HTTP 200.
- **2:45 – 3:00 (Deployment & Wrap-up)**: Docker container reproducibility, sub-50ms latency, and final release certification.

---

## License
Production software engineered for Smart Campus Energy Optimization.
All rights reserved by the engineering authors: Pritam Biswas, Gajiul Islam, Omar Shihab, and Sajjad Hossain Siam.
