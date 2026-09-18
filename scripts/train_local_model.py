"""
Local Model Training Pipeline for PowerMind
Trains a zero-dependency offline ML intent classifier and parameter extractor
using the dataset JSON (BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json) and
synthetic canonical samples.
"""
import os
import re
import json
import math
from typing import List, Dict, Any, Tuple
from collections import defaultdict

DATASET_FILE = "BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json"
OUTPUT_MODEL_FILE = os.path.join("app", "llm", "local_model_artifact.json")

DIRECTIVE_CLASSES = [
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
]

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text into words and 2-grams."""
    cleaned = re.sub(r"[^a-zA-Z0-9%/\-\s]", " ", text.lower())
    words = [w for w in cleaned.split() if len(w) > 1]
    bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
    return words + bigrams

def load_training_data() -> List[Dict[str, Any]]:
    dataset = []
    
    # 1. Load from provided sample cases JSON
    if os.path.exists(DATASET_FILE):
        with open(DATASET_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for case in data.get("cases", []):
                notes = case.get("input", {}).get("operator_notes", [])
                expected_dirs = case.get("expected_output", {}).get("directive_interpretation", [])
                for idx, note in enumerate(notes):
                    if idx < len(expected_dirs):
                        d = expected_dirs[idx]
                        dataset.append({
                            "note": note,
                            "directive_type": d.get("directive_type"),
                            "applies": d.get("applies", False),
                            "adjustment": d.get("structured_adjustment"),
                            "source": case.get("id", "dataset")
                        })

    # 2. Add domain-specific training augmentations to ensure robust generalization
    augmentations = [
        # Solar reduction
        ("PV production drops by 70% from 11:00 to 14:00 due to overcast clouds.", "solar_reduction", True, {"hours": [11, 12, 13], "factor": 0.3}),
        ("Rooftop solar panels will only generate one-quarter capacity between 1 PM and 3 PM.", "solar_reduction", True, {"hours": [13, 14], "factor": 0.25}),
        ("Solar output cut by half from 10 AM to 12 PM for routine inverter calibration.", "solar_reduction", True, {"hours": [10, 11], "factor": 0.5}),
        ("Expect an 80% reduction in rooftop solar during the 1-3 PM maintenance window.", "solar_reduction", True, {"hours": [13, 14], "factor": 0.2}),
        
        # Minimum battery reserve
        ("Maintain an emergency battery reserve of at least 100 kWh between 18:00 and 21:00.", "minimum_battery_reserve", True, {"hours": [18, 19, 20], "minimum_energy_kwh": 100.0}),
        ("Keep battery state of charge above 80 kWh from 7 PM to 10 PM for the auditorium event.", "minimum_battery_reserve", True, {"hours": [19, 20, 21], "minimum_energy_kwh": 80.0}),
        ("Hold reserve energy at 120 kWh from 17:00 to 20:00.", "minimum_battery_reserve", True, {"hours": [17, 18, 19], "minimum_energy_kwh": 120.0}),

        # No charge window
        ("Do not charge the battery from 2 PM to 4 PM while the main transformer is inspected.", "no_charge_window", True, {"hours": [14, 15]}),
        ("Disable battery charging between 13:00 and 16:00 during substation wiring check.", "no_charge_window", True, {"hours": [13, 14, 15]}),
        ("Avoid charging the battery bank from 8 AM to 10 AM.", "no_charge_window", True, {"hours": [8, 9]}),

        # No discharge window
        ("Do not discharge the battery between 12:00 and 15:00 while cooling systems are tested.", "no_discharge_window", True, {"hours": [12, 13, 14]}),
        ("Prevent battery discharge from 6 AM to 9 AM to preserve energy.", "no_discharge_window", True, {"hours": [6, 7, 8]}),

        # Max grid window
        ("Cap grid import to 60 kWh between 18:00 and 21:00 due to feeder congestion.", "max_grid_window", True, {"hours": [18, 19, 20], "max_grid_kwh": 60.0}),
        ("Maximum grid power allowed is 50 kWh from 7 PM to 9 PM.", "max_grid_window", True, {"hours": [19, 20], "max_grid_kwh": 50.0}),

        # No-op distractors
        ("Staff lunch meeting in the cafeteria at 1 PM.", "no_op", False, None),
        ("The campus shuttle bus schedule has been updated for exam week.", "no_op", False, None),
        ("Sports day registration deadline extended to next Friday.", "no_op", False, None),
        ("Weather report: pleasant breeze expected across campus today.", "no_op", False, None),
        ("Welcome all delegates and students to the annual technology summit.", "no_op", False, None)
    ]

    for note, d_type, applies, adj in augmentations:
        dataset.append({
            "note": note,
            "directive_type": d_type,
            "applies": applies,
            "adjustment": adj,
            "source": "augmentation"
        })

    return dataset

def train_model():
    data = load_training_data()
    print(f"Loaded {len(data)} training examples.")

    # Calculate class counts & document frequencies
    class_doc_counts = defaultdict(int)
    term_doc_counts = defaultdict(lambda: defaultdict(int))
    total_docs = len(data)

    vocab = set()
    for item in data:
        c = item["directive_type"]
        class_doc_counts[c] += 1
        tokens = set(tokenize(item["note"]))
        for t in tokens:
            vocab.add(t)
            term_doc_counts[c][t] += 1

    # Compute TF-IDF weighted class log-likelihoods (Multinomial Naive Bayes / Term weights)
    class_priors = {c: math.log(class_doc_counts[c] / total_docs) for c in DIRECTIVE_CLASSES}
    
    # Feature weights per class
    feature_weights = {}
    for c in DIRECTIVE_CLASSES:
        feature_weights[c] = {}
        total_tokens_c = sum(term_doc_counts[c].values()) + len(vocab)
        for t in vocab:
            count = term_doc_counts[c][t]
            # Laplace smoothing
            feature_weights[c][t] = round(math.log((count + 1) / total_tokens_c), 5)

    # Key phrase rule boosts
    rules = {
        "solar_reduction": ["solar", "pv", "rooftop", "panel", "cloud", "washing", "cleaning"],
        "minimum_battery_reserve": ["reserve", "emergency", "minimum", "hold", "preserve", "keep_battery", "above"],
        "no_charge_window": ["do_not_charge", "no_charge", "avoid_charging", "disable_charging", "prevent_charging", "not_charge"],
        "no_discharge_window": ["do_not_discharge", "no_discharge", "avoid_discharging", "disable_discharging", "prevent_discharge", "not_discharge"],
        "max_grid_window": ["cap_grid", "limit_grid", "feeder", "transformer_rating", "max_grid", "import_to"],
        "no_op": ["cafeteria", "lunch", "meeting", "shuttle", "bus", "registration", "sports", "weather", "welcome", "seminar"]
    }

    model_artifact = {
        "model_version": "1.0.0",
        "dataset_source": DATASET_FILE,
        "classes": DIRECTIVE_CLASSES,
        "sample_count": total_docs,
        "class_priors": class_priors,
        "feature_weights": feature_weights,
        "rules": rules
    }

    os.makedirs(os.path.dirname(OUTPUT_MODEL_FILE), exist_ok=True)
    with open(OUTPUT_MODEL_FILE, "w", encoding="utf-8") as f:
        json.dump(model_artifact, f, indent=2)

    print(f"Model successfully trained and saved to: {OUTPUT_MODEL_FILE}")

    # Evaluate accuracy on dataset
    correct = 0
    for item in data:
        pred_type = predict_directive_type(item["note"], model_artifact)
        if pred_type == item["directive_type"]:
            correct += 1
        else:
            print(f"Misclassified: '{item['note']}' -> predicted {pred_type}, expected {item['directive_type']}")

    accuracy = (correct / total_docs) * 100
    print(f"Training accuracy: {accuracy:.2f}% ({correct}/{total_docs})")

def predict_directive_type(note: str, artifact: Dict[str, Any]) -> str:
    tokens = tokenize(note)
    scores = {}
    
    # Base scores from prior + feature weights
    for c in artifact["classes"]:
        score = artifact["class_priors"].get(c, 0.0)
        c_weights = artifact["feature_weights"].get(c, {})
        for t in tokens:
            if t in c_weights:
                score += c_weights[t]
        
        # Rule boost
        for keyword in artifact["rules"].get(c, []):
            if keyword in note.lower():
                score += 5.0
        scores[c] = score

    return max(scores.items(), key=lambda x: x[1])[0]

if __name__ == "__main__":
    train_model()
