import logging
import time
from typing import Tuple, Dict, Any
from fastapi import HTTPException
from app.schemas import (
    OptimizeEnergyRequest,
    OptimizeEnergyResponse,
    DirectiveInterpretationItem
)
from app.llm.interpreter import LLMInterpreter
from app.directives.validators import validate_interpretations
from app.directives.canonicalizer import canonicalize_all
from app.directives.applier import build_effective_scenario
from app.optimizer.solver import EnergyOptimizer
from app.optimizer.replay import ReplayValidator
from app.config import settings

logger = logging.getLogger("powermind.service")

class EnergyOptimizationService:
    def __init__(self):
        self.interpreter = LLMInterpreter()
        self.optimizer = EnergyOptimizer(
            tolerance=settings.SOLVER_TOLERANCE,
            timeout_seconds=settings.SOLVER_TIMEOUT_SECONDS
        )
        self.replay_validator = ReplayValidator(tolerance=settings.SOLVER_TOLERANCE)

    async def optimize(
        self, request: OptimizeEnergyRequest
    ) -> Tuple[OptimizeEnergyResponse, Dict[str, Any]]:
        """
        Executes the full pipeline:
        request -> LLM -> guardrails -> canonical constraints -> solver -> independent replay -> response.
        """
        start_time = time.time()

        # Step 1: LLM Interpretation
        try:
            interpretations, llm_meta = await self.interpreter.interpret_notes(
                operator_notes=request.operator_notes,
                battery_capacity_kwh=request.battery.capacity_kwh,
                runtime_config=request.llm_config
            )
        except Exception as e:
            logger.error(f"LLM Interpretation fatal error: {e}")
            raise HTTPException(status_code=500, detail=f"LLM interpretation error: {str(e)}")

        # Step 2: Deterministic Guardrails and Validation
        try:
            validate_interpretations(
                interpretations=interpretations,
                expected_count=len(request.operator_notes),
                battery_capacity_kwh=request.battery.capacity_kwh
            )
        except Exception as e:
            logger.error(f"Deterministic directive validation error: {e}")
            raise HTTPException(status_code=422, detail=f"Directive validation failed: {str(e)}")

        # Step 3: Canonicalization
        canonical_directives = canonicalize_all(interpretations)

        # Step 4: Build Effective Mathematical Scenario
        effective_scenario = build_effective_scenario(
            hours_input=request.hours,
            battery_config=request.battery,
            directives=canonical_directives
        )

        # Step 5: Optimization
        solver_start = time.time()
        result = self.optimizer.solve(effective_scenario)
        solver_duration = time.time() - solver_start

        if not result.success:
            logger.error(f"Solver failed: {result.message}")
            raise HTTPException(
                status_code=422,
                detail=f"Optimization failed to find feasible schedule: {result.message}"
            )

        # Step 6: Independent Replay Validation
        replay_result = self.replay_validator.validate(
            plan=result.hourly_plan,
            scenario=effective_scenario,
            reported_total_grid=result.total_grid_kwh,
            reported_total_cost=result.total_cost_bdt,
            reported_peak_grid=result.peak_grid_kwh
        )

        if not replay_result.passed:
            logger.warning(
                f"Initial replay validation failed: {replay_result.violations}. Attempting bounded repair re-solve."
            )
            # Bounded re-solve cycle: relax any numerical micro-chatter
            relaxed_optimizer = EnergyOptimizer(tolerance=1e-4, timeout_seconds=settings.SOLVER_TIMEOUT_SECONDS)
            re_result = relaxed_optimizer.solve(effective_scenario)
            
            if re_result.success:
                second_replay = self.replay_validator.validate(
                    plan=re_result.hourly_plan,
                    scenario=effective_scenario,
                    reported_total_grid=re_result.total_grid_kwh,
                    reported_total_cost=re_result.total_cost_bdt,
                    reported_peak_grid=re_result.peak_grid_kwh
                )
                if second_replay.passed:
                    result = re_result
                    replay_result = second_replay
                else:
                    logger.critical(f"Re-solve replay also failed: {second_replay.violations}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Replay validation detected violations: {'; '.join(second_replay.violations[:3])}"
                    )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Replay validation detected violations: {'; '.join(replay_result.violations[:3])}"
                )

        # Step 7: Compose Plan Summary
        applied_count = sum(1 for d in canonical_directives if d.applies)
        plan_summary = (
            f"Optimized 24-hour schedule for scenario '{request.scenario_id}' with "
            f"{len(request.operator_notes)} notes processed ({applied_count} applied directives). "
            f"Total grid import: {result.total_grid_kwh:.2f} kWh, Total cost: {result.total_cost_bdt:.2f} BDT, "
            f"Peak grid: {result.peak_grid_kwh:.2f} kWh. End-of-day battery neutrality preserved."
        )

        total_duration = time.time() - start_time
        meta = {
            "total_latency_ms": round(total_duration * 1000, 2),
            "solver_latency_ms": round(solver_duration * 1000, 2),
            "llm": llm_meta,
            "replay_passed": replay_result.passed,
            "effective_scenario": effective_scenario.model_dump()
        }

        response = OptimizeEnergyResponse(
            scenario_id=request.scenario_id,
            directive_interpretation=interpretations,
            hourly_plan=result.hourly_plan,
            total_grid_kwh=result.total_grid_kwh,
            total_cost_bdt=result.total_cost_bdt,
            peak_grid_kwh=result.peak_grid_kwh,
            plan_summary=plan_summary
        )

        return response, meta

energy_service = EnergyOptimizationService()
