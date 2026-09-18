import pytest
from app.llm.parser import parse_and_validate_llm_output, LLMParseError

def test_parse_valid_json_with_fences():
    raw = """```json
[
  {
    "note_index": 0,
    "applies": true,
    "directive_type": "solar_reduction",
    "structured_adjustment": {
      "hours": [13, 14],
      "factor": 0.2
    },
    "explanation": "20% solar due to maintenance"
  },
  {
    "note_index": 1,
    "applies": false,
    "directive_type": "no_op",
    "structured_adjustment": null,
    "explanation": "Irrelevant announcement"
  }
]
```"""
    res = parse_and_validate_llm_output(raw, expected_notes_count=2, battery_capacity_kwh=200.0)
    assert len(res) == 2
    assert res[0].directive_type == "solar_reduction"
    assert res[0].applies is True
    assert res[1].directive_type == "no_op"
    assert res[1].applies is False

def test_parse_invalid_count():
    raw = '[{"note_index": 0, "applies": false, "directive_type": "no_op", "structured_adjustment": null, "explanation": ""}]'
    with pytest.raises(LLMParseError) as exc:
        parse_and_validate_llm_output(raw, expected_notes_count=2)
    assert "Expected 2 interpretations" in str(exc.value)

def test_parse_unsupported_directive():
    raw = '[{"note_index": 0, "applies": true, "directive_type": "turn_off_grid", "structured_adjustment": {}, "explanation": ""}]'
    with pytest.raises(LLMParseError) as exc:
        parse_and_validate_llm_output(raw, expected_notes_count=1)
    assert "unsupported directive_type" in str(exc.value)
