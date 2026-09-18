import pytest
from app.llm.client import MockDeterministicLLMClient
from app.directives.types import DirectiveType

def test_adversarial_solar_paraphrases():
    client = MockDeterministicLLMClient(model="mock-test")
    test_cases = [
        "PV production will drop to about 20% between 13:00 and 15:00.",
        "Panel washing from one until three will leave roughly one-fifth of normal solar output.",
        "Expect an 80% reduction in rooftop solar during the 1-3 PM maintenance window."
    ]

    for note in test_cases:
        res = client._interpret_single_note(0, note)
        assert res["directive_type"] == DirectiveType.SOLAR_REDUCTION.value
        assert res["applies"] is True
        assert res["structured_adjustment"]["hours"] == [13, 14]
        assert abs(res["structured_adjustment"]["factor"] - 0.2) < 0.05

def test_adversarial_distractor_notes():
    client = MockDeterministicLLMClient(model="mock-test")
    distractors = [
        "Staff lunch meeting in the cafeteria at noon.",
        "Welcome all delegates to the Campus Technology Summit 2026.",
        "The weather looks nice today, mild breeze across campus."
    ]

    for note in distractors:
        res = client._interpret_single_note(0, note)
        assert res["directive_type"] == DirectiveType.NO_OP.value
        assert res["applies"] is False
        assert res["structured_adjustment"] is None

def test_adversarial_grid_and_battery_notes():
    client = MockDeterministicLLMClient(model="mock-test")
    
    res1 = client._interpret_single_note(0, "Cap grid import to 50 kWh between 18:00 and 20:00 due to feeder limit.")
    assert res1["directive_type"] == DirectiveType.MAX_GRID_WINDOW.value
    assert res1["structured_adjustment"]["max_grid_kwh"] == 50.0

    res2 = client._interpret_single_note(0, "Halt charging from 2 PM to 4 PM while transformer oil is checked.")
    assert res2["directive_type"] == DirectiveType.NO_CHARGE_WINDOW.value
    assert res2["structured_adjustment"]["hours"] == [14, 15]

    res3 = client._interpret_single_note(0, "Keep emergency battery reserve at least 120 kWh from 6 PM to 9 PM.")
    assert res3["directive_type"] == DirectiveType.MINIMUM_BATTERY_RESERVE.value
    assert res3["structured_adjustment"]["minimum_energy_kwh"] == 120.0
