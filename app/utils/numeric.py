import math

TOLERANCE = 1e-5

def is_close(a: float, b: float, tol: float = TOLERANCE) -> bool:
    return abs(a - b) <= tol

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(val, max_val))

def round_metric(val: float, decimals: int = 4) -> float:
    if math.isnan(val) or math.isinf(val):
        return 0.0
    return round(float(val), decimals)
