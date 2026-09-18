# PowerMind: Product Requirements Document (PRD)

**Project Name**: PowerMind — Smart Campus Energy Optimization Engine  
**System Type**: Agentic Energy Optimization REST API & Dashboard  
**Status**: Production-Ready  

---

## 1. Executive Summary & Vision

University campuses face dynamic energy challenges: volatile electricity tariffs, fluctuating solar PV generation, and physical battery degradation constraints. Concurrently, human operators receive real-time operational updates (e.g. equipment maintenance, guest convocation lectures, substation limits) communicated via natural language.

**PowerMind** bridges natural language operations and mathematical energy dispatch. It adopts the strict architectural axiom:
> **The LLM interprets language; deterministic code validates intent; the mathematical optimizer makes the energy decisions.**

The LLM is strictly constrained to interpreting operator notes into canonical directives. It is never allowed to directly hallucinate or invent energy schedules. Physical feasibility, energy balance, and end-of-day battery neutrality are guaranteed by Google OR-Tools and verified by an independent zero-trust replay validator.

---

## 2. Team Credits

PowerMind was designed and engineered by:

- **Pritam Biswas** — [GitHub: pbs002-s](https://github.com/pbs002-s)  
  *Core Architect & Backend Lead*
- **Gajiul Islam** — [GitHub: logic-forge119](https://github.com/logic-forge119)  
  *Optimizer & Mathematical Modeling Lead*
- **Omar Shihab** — [GitHub: omarshihab1501](https://github.com/omarshihab1501)  
  *LLM & Guardrails Systems Engineer*
- **Sajjad Hossain Siam** — [GitHub: sajjadhossain693](https://github.com/sajjadhossain693)  
  *Verification, QA & Full-Stack Engineer*

---

## 3. Product Scope & Functional Requirements

### 3.1 Supported Directives
The system strictly supports exactly six directive types:
1. `solar_reduction`: Multiplicative reduction of rooftop solar output during specified hours (e.g., panel cleaning).
2. `minimum_battery_reserve`: Elevated battery state-of-charge floor during critical campus events (e.g., convocation).
3. `no_charge_window`: Forbidden grid/solar charging during maintenance windows.
4. `no_discharge_window`: Forbidden battery discharge to preserve stored energy.
5. `max_grid_window`: Physical cap on power imported from the national grid (substation feeder limits).
6. `no_op`: Informational campus notices or commentary containing no operational energy constraints.

### 3.2 Canonical API Endpoints
- `GET /health`: Ultra-fast liveness check returning `{"status": "ok"}`. Zero dependency on external models.
- `POST /optimize-energy`: Accepts 24-hour scenario, 1–3 operator notes, battery config, and returns the machine-checkable 24-hour schedule.

### 3.3 Graphical User Interface (UI)
- Minimal, dark-mode, responsive executive dashboard.
- Configurable LLM Scan Model (`gemini-2.5-flash`, `gpt-4o-mini`, `llama-3.3-70b`, `mock`).
- Direct in-browser API Key configuration with local storage persistence.
- Live connectivity latency tester.
- Multi-chart 24-hour dispatch and battery state-of-charge trajectory visualizations.
- 1-Click JSON & CSV export.
- Interactive Team Credits modal.

---

## 4. Non-Functional Requirements
- **Latency**: p95 target $\le 5.0$ seconds (achieved: **~19.3 ms** in deterministic local mode).
- **Correctness**: Zero physical or operational constraint violations.
- **Determinism**: Identical inputs yield identical mathematical schedules.
- **Security**: No hardcoded API keys; sanitized error messages with zero internal traceback leaks.
- **Reproducibility**: Multi-stage Docker container buildable and runnable in one command.
