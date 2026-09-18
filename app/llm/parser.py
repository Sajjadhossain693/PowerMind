import json
import re
from typing import List, Dict, Any, Tuple
from app.directives.types import (
    DirectiveType,
    SolarReductionAdjustment,
    MinimumBatteryReserveAdjustment,
    NoChargeWindowAdjustment,
    NoDischargeWindowAdjustment,
    MaxGridWindowAdjustment
)
from app.schemas import DirectiveInterpretationItem

class LLMParseError(Exception):
    pass

def clean_llm_json_text(text: str) -> str:
    """Removes markdown code fences, backticks, or trailing notes."""
    s = text.strip()
    if s.startswith("```"):
        # Strip ```json or ```
        s = re.sub(r"^```[a-zA-Z]*\n?", "", s)
        s = re.sub(r"\n?```$", "", s)
        s = s.strip()
    
    # Try finding [ ... ] array
    start_bracket = s.find("[")
    end_bracket = s.rfind("]")
    if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
        s = s[start_bracket : end_bracket + 1]
        
    return s

def parse_and_validate_llm_output(
    raw_text: str,
    expected_notes_count: int,
    battery_capacity_kwh: float = 1e9
) -> List[DirectiveInterpretationItem]:
    """
    Parses LLM output into strict DirectiveInterpretationItem list.
    Enforces all schema and semantic invariants.
    """
    cleaned = clean_llm_json_text(raw_text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        raise LLMParseError(f"Malformed JSON output from model: {e}")

    if not isinstance(data, list):
        raise LLMParseError(f"Expected a JSON list of interpretations, got {type(data).__name__}")

    if len(data) != expected_notes_count:
        raise LLMParseError(
            f"Expected {expected_notes_count} interpretations, got {len(data)}"
        )

    results: List[DirectiveInterpretationItem] = []
    seen_indices = set()

    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise LLMParseError(f"Item {idx} is not an object")

        note_index = item.get("note_index")
        if note_index is None or not isinstance(note_index, int):
            raise LLMParseError(f"Item {idx} missing or invalid integer 'note_index'")

        if note_index in seen_indices:
            raise LLMParseError(f"Duplicate note_index {note_index}")
        seen_indices.add(note_index)

        # Ensure order matches
        if note_index != idx:
            raise LLMParseError(f"Expected note_index {idx}, got {note_index}")

        raw_type = item.get("directive_type")
        if not raw_type or not isinstance(raw_type, str):
            raise LLMParseError(f"Item {idx} missing or invalid directive_type")

        # Canonicalize directive_type enum
        try:
            directive_type = DirectiveType(raw_type.strip().lower())
        except ValueError:
            raise LLMParseError(f"Item {idx} has unsupported directive_type: '{raw_type}'")

        applies = item.get("applies", False)
        structured_adj = item.get("structured_adjustment")
        explanation = str(item.get("explanation", "")).strip()

        # Rule: no_op requires applies=false and structured_adjustment=null
        if directive_type == DirectiveType.NO_OP:
            if applies:
                # Force applies=false for no_op
                applies = False
            structured_adj = None
        else:
            # All other directives require applies=true
            if not applies:
                applies = True
            if structured_adj is None:
                raise LLMParseError(
                    f"Directive '{directive_type.value}' requires a non-null structured_adjustment"
                )

            # Validate structured adjustment by type
            try:
                if directive_type == DirectiveType.SOLAR_REDUCTION:
                    adj_obj = SolarReductionAdjustment(**structured_adj)
                    structured_adj = adj_obj.model_dump()
                elif directive_type == DirectiveType.MINIMUM_BATTERY_RESERVE:
                    adj_obj = MinimumBatteryReserveAdjustment(**structured_adj)
                    if adj_obj.minimum_energy_kwh > battery_capacity_kwh:
                        raise ValueError(
                            f"Reserve {adj_obj.minimum_energy_kwh} exceeds battery capacity {battery_capacity_kwh}"
                        )
                    structured_adj = adj_obj.model_dump()
                elif directive_type == DirectiveType.NO_CHARGE_WINDOW:
                    adj_obj = NoChargeWindowAdjustment(**structured_adj)
                    structured_adj = adj_obj.model_dump()
                elif directive_type == DirectiveType.NO_DISCHARGE_WINDOW:
                    adj_obj = NoDischargeWindowAdjustment(**structured_adj)
                    structured_adj = adj_obj.model_dump()
                elif directive_type == DirectiveType.MAX_GRID_WINDOW:
                    adj_obj = MaxGridWindowAdjustment(**structured_adj)
                    structured_adj = adj_obj.model_dump()
            except Exception as e:
                raise LLMParseError(f"Invalid adjustment for {directive_type.value}: {e}")

        results.append(
            DirectiveInterpretationItem(
                note_index=note_index,
                applies=applies,
                directive_type=directive_type.value,
                structured_adjustment=structured_adj,
                explanation=explanation or f"Applied directive {directive_type.value}"
            )
        )

    return results
