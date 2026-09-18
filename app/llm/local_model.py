"""
Offline Trained Local Model Inference Engine for PowerMind
Uses artifact trained from BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json
and canonical domain samples to classify operator directives with zero external API calls.
"""
import os
import re
import json
from typing import List, Dict, Any, Optional
from app.utils.time_parser import extract_hour_range

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "local_model_artifact.json")

class LocalTrainedModel:
    def __init__(self, artifact_path: Optional[str] = None):
        self.path = artifact_path or ARTIFACT_PATH
        self.artifact = self._load_artifact()

    def _load_artifact(self) -> Dict[str, Any]:
        if os.path.exists(self.path):
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9%/\-\s]", " ", text.lower())
        words = [w for w in cleaned.split() if len(w) > 1]
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        return words + bigrams

    def predict_directive_type(self, note: str) -> str:
        if not self.artifact:
            # Fallback heuristic if artifact missing
            nl = note.lower()
            if "solar" in nl or "pv" in nl or "panel" in nl:
                return "solar_reduction"
            if "reserve" in nl or "emergency" in nl:
                return "minimum_battery_reserve"
            if "not charge" in nl or "no charge" in nl:
                return "no_charge_window"
            if "not discharge" in nl or "no discharge" in nl:
                return "no_discharge_window"
            if "cap grid" in nl or "limit grid" in nl or "feeder" in nl:
                return "max_grid_window"
            return "no_op"

        tokens = self._tokenize(note)
        scores = {}
        for c in self.artifact.get("classes", []):
            score = self.artifact.get("class_priors", {}).get(c, 0.0)
            c_weights = self.artifact.get("feature_weights", {}).get(c, {})
            for t in tokens:
                if t in c_weights:
                    score += c_weights[t]
            for keyword in self.artifact.get("rules", {}).get(c, []):
                if keyword in note.lower():
                    score += 5.0
            scores[c] = score

        return max(scores.items(), key=lambda x: x[1])[0]

    def interpret_note(self, idx: int, note: str) -> Dict[str, Any]:
        nl = note.lower()
        d_type = self.predict_directive_type(note)
        hours = extract_hour_range(note) or [13, 14]

        if d_type == "no_op":
            return {
                "note_index": idx,
                "applies": False,
                "directive_type": "no_op",
                "structured_adjustment": None,
                "explanation": "Note contains general information and does not require schedule changes."
            }

        if d_type == "solar_reduction":
            factor = 0.2
            if "one-fifth" in nl or "one fifth" in nl or "1/5" in nl:
                factor = 0.2
            elif "half" in nl or "50%" in nl:
                factor = 0.5
            elif "one-quarter" in nl or "one quarter" in nl or "one fourth" in nl or "25%" in nl:
                if "drop to" in nl or "leave" in nl or "remaining" in nl:
                    factor = 0.25
                else:
                    factor = 0.75
            elif "80%" in nl or "eighty percent" in nl:
                if "reduction" in nl or "drop of" in nl or "loss" in nl:
                    factor = 0.2
                else:
                    factor = 0.8
            elif "70%" in nl:
                factor = 0.3 if ("reduction" in nl or "drop" in nl or "cut" in nl) else 0.7
            elif "75%" in nl:
                factor = 0.25 if ("reduction" in nl or "drop" in nl or "cut" in nl) else 0.75
            else:
                pct_match = re.search(r"(\d+)%", nl)
                if pct_match:
                    val = float(pct_match.group(1)) / 100.0
                    factor = round(1.0 - val, 2) if ("reduction" in nl or "drop" in nl) else val

            return {
                "note_index": idx,
                "applies": True,
                "directive_type": "solar_reduction",
                "structured_adjustment": {
                    "hours": hours,
                    "factor": factor
                },
                "explanation": f"Solar reduction applied with factor {factor} during hours {hours} (local model)."
            }

        if d_type == "minimum_battery_reserve":
            kwh = 100.0
            kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kwh|kw)", nl)
            if kwh_match:
                kwh = float(kwh_match.group(1))
            return {
                "note_index": idx,
                "applies": True,
                "directive_type": "minimum_battery_reserve",
                "structured_adjustment": {
                    "hours": hours,
                    "minimum_energy_kwh": kwh
                },
                "explanation": f"Maintain minimum battery reserve of {kwh} kWh during hours {hours} (local model)."
            }

        if d_type == "no_charge_window":
            return {
                "note_index": idx,
                "applies": True,
                "directive_type": "no_charge_window",
                "structured_adjustment": {"hours": hours},
                "explanation": f"Battery charging forbidden during hours {hours} (local model)."
            }

        if d_type == "no_discharge_window":
            return {
                "note_index": idx,
                "applies": True,
                "directive_type": "no_discharge_window",
                "structured_adjustment": {"hours": hours},
                "explanation": f"Battery discharging forbidden during hours {hours} (local model)."
            }

        if d_type == "max_grid_window":
            cap = 50.0
            num_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kwh|kw)", nl)
            if num_match:
                cap = float(num_match.group(1))
            return {
                "note_index": idx,
                "applies": True,
                "directive_type": "max_grid_window",
                "structured_adjustment": {
                    "hours": hours,
                    "max_grid_kwh": cap
                },
                "explanation": f"Limit grid import to {cap} kWh during hours {hours} (local model)."
            }

        return {
            "note_index": idx,
            "applies": False,
            "directive_type": "no_op",
            "structured_adjustment": None,
            "explanation": "Note does not require energy adjustments."
        }
