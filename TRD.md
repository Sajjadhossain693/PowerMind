# PowerMind: Technical Requirements Document (TRD)

**System Architecture & Mathematical Optimization Specification**  
**Project**: PowerMind — Smart Campus Energy Optimization Engine  

---

## 1. Architectural Pipeline

```text
Operator Note
      │
      ▼
LLM Interpretation Layer (Gemini / OpenAI / Groq / Mock)
      │
      ▼
Strict JSON Schema Validation (Pydantic v2)
      │
      ▼
Deterministic Semantic Guardrails
      │
      ▼
Canonical Directive Representation
      │
      ▼
Constraint Generator (EffectiveScenario)
      │
      ▼
Mathematical Optimization Solver (OR-Tools MILP)
      │
      ▼
Independent Zero-Trust Replay Validator
      │
      ├─── PASS ───► Final JSON Response & UI Render
      │
      └─── FAIL ───► Bounded Repair Re-solve (Max 1 cycle)
```

---

## 2. Mathematical Optimization Formulation

The campus scheduling is formulated as a Mixed-Integer Linear Program (MILP) over a discrete 24-hour horizon $h \in \{0, 1, \dots, 23\}$.

### 2.1 Decision Variables
- $g_h \in [0, \infty)$: Grid import power in hour $h$ (kWh)
- $s_h \in [0, \text{effective\_solar}_h]$: Solar power utilized in hour $h$ (kWh)
- $c_h \in [0, \text{max\_charge}]$: Battery charging energy in hour $h$ (kWh)
- $d_h \in [0, \text{max\_discharge}]$: Battery discharge energy in hour $h$ (kWh)
- $e_h \in [\text{dynamic\_reserve}_h, \text{capacity}]$: Battery stored energy after hour $h$ (kWh)
- $u_h^{\text{chg}} \in \{0, 1\}$: Binary charging mode indicator
- $u_h^{\text{dis}} \in \{0, 1\}$: Binary discharging mode indicator

### 2.2 Objective Function
Minimize total tariff expenditure over the 24-hour window:
$$\min \sum_{h=0}^{23} \left( g_h \cdot \text{tariff}_h + \epsilon \cdot c_h + \epsilon \cdot d_h \right)$$
where $\epsilon = 10^{-6}$ is an infinitesimal regularization factor to prevent spurious battery cycling when grid tariffs are uniform.

### 2.3 System Constraints
1. **Energy Balance**:
   $$g_h + s_h + d_h - c_h = \text{demand}_h \quad \forall h \in \{0, \dots, 23\}$$
2. **Solar Upper Bound**:
   $$0 \le s_h \le \text{effective\_solar}_h \quad \forall h \in \{0, \dots, 23\}$$
3. **Battery State of Charge Transition**:
   $$e_0 = \text{initial\_energy} + c_0 - d_0$$
   $$e_h = e_{h-1} + c_h - d_h \quad \forall h \in \{1, \dots, 23\}$$
4. **Mutual Exclusivity of Inverter**:
   $$u_h^{\text{chg}} + u_h^{\text{dis}} \le 1 \quad \forall h$$
   $$c_h \le \text{max\_charge} \cdot u_h^{\text{chg}}$$
   $$d_h \le \text{max\_discharge} \cdot u_h^{\text{dis}}$$
5. **Mandatory End-of-Day Neutrality**:
   $$e_{23} = \text{initial\_energy}$$
   *(Ensures multi-day operational sustainability without energy depletion).*

### 2.4 Directive Constraint Mapping
- **`solar_reduction`**: $\text{effective\_solar}_h = \text{original\_solar}_h \cdot \min(\text{factors}_h)$
- **`minimum_battery_reserve`**: $\text{dynamic\_reserve}_h = \max(\text{base\_reserve}, \text{directive\_reserve}_h)$
- **`no_charge_window`**: $u_h^{\text{chg}} = 0 \implies c_h = 0 \quad \forall h \in \text{window}$
- **`no_discharge_window`**: $u_h^{\text{dis}} = 0 \implies d_h = 0 \quad \forall h \in \text{window}$
- **`max_grid_window`**: $g_h \le \min(\text{caps}_h) \quad \forall h \in \text{window}$
- **`no_op`**: No constraint mutation.

---

## 3. Independent Replay Validation Protocol

The validator executes independently of the solver:
1. $g_h \ge -\text{tol}$ and $s_h \ge -\text{tol}$ and $b_h \ge -\text{tol}$
2. $s_h \le \text{effective\_solar}_h + \text{tol}$
3. Energy balance equation holds within $\pm 0.05$ kWh
4. Battery energy step matches: $e_h == e_{h-1} + c_h - d_h$
5. $e_h \le \text{capacity} + \text{tol}$ and $e_h \ge \text{dynamic\_reserve}_h - \text{tol}$
6. Charging rate $\le \text{max\_charge} + \text{tol}$; discharging rate $\le \text{max\_discharge} + \text{tol}$
7. Forbidden charge/discharge hours contain exactly $0.0$ kWh flow
8. Grid import cap respected: $g_h \le \text{cap}_h + \text{tol}$
9. End-of-day condition: $|e_{23} - \text{initial\_energy}| \le 0.05$ kWh
10. Independent recalculation of totals matches reported payload within tolerance.
