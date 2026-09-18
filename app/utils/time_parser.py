import re
from typing import List, Optional, Tuple

WORD_TO_NUM = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "twenty-one": 21, "twenty-two": 22,
    "twenty-three": 23, "noon": 12, "midnight": 0
}

def parse_hour_token(token: str, default_period: Optional[str] = None) -> Optional[int]:
    """Parse a single hour representation to integer 0..23."""
    t = token.strip().lower().strip(".,;:!?()[]{}")
    
    # Check words first
    if t in WORD_TO_NUM:
        val = WORD_TO_NUM[t]
        if default_period == "pm" and val < 12 and val != 0:
            val += 12
        elif default_period == "am" and val == 12:
            val = 0
        return val

    # Match patterns like 13:00, 1pm, 1:00pm, 13, 1 pm
    m = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$", t)
    if not m:
        return None
    
    hour = int(m.group(1))
    period = m.group(3) or default_period

    if period == "pm":
        if hour < 12:
            hour += 12
    elif period == "am":
        if hour == 12:
            hour = 0
            
    if 0 <= hour <= 24:
        return hour
    return None

def extract_hour_range(text: str) -> Optional[List[int]]:
    """
    Extracts start and end hours from natural language, enforcing
    inclusive start and exclusive end.
    Example: 1 PM to 3 PM => [13, 14]
    """
    text_clean = text.strip()
    text_lower = text_clean.lower()

    # Detect global hints in sentence
    has_pm = bool(re.search(r"\b(pm|afternoon|evening|night)\b", text_lower))
    has_am = bool(re.search(r"\b(am|morning)\b", text_lower))
    is_solar_context = bool(re.search(r"\b(solar|pv|rooftop|panel|sunlight)\b", text_lower))
    
    patterns = [
        # between X and Y (e.g. between 13:00 and 15:00, between 1 and 3 pm)
        r"between\s+([a-z0-9:.-]+(?:\s*[ap]m)?)\s+(?:and|to)\s+([a-z0-9:.-]+(?:\s*[ap]m)?)",
        # from X to/until Y
        r"(?:from\s+)?([a-z0-9:.-]+(?:\s*[ap]m)?)\s*(?:to|until|through)\s*([a-z0-9:.-]+(?:\s*[ap]m)?)",
        # X-Y window e.g. 1-3 PM or 13:00-15:00
        r"([a-z0-9:.-]+(?:\s*[ap]m)?)\s*[-–]\s*([a-z0-9:.-]+(?:\s*[ap]m)?)",
    ]
    
    for pat in patterns:
        matches = re.finditer(pat, text_lower)
        for match in matches:
            t1 = match.group(1).strip().strip(".,;:")
            t2 = match.group(2).strip().strip(".,;:")

            end_pos = match.end()
            surrounding = text_lower[end_pos : end_pos + 6]
            surrounding_pm = bool(re.match(r"^\s*pm\b", surrounding))
            surrounding_am = bool(re.match(r"^\s*am\b", surrounding))

            p2 = "pm" if ("pm" in t2 or surrounding_pm or (has_pm and not has_am)) else ("am" if ("am" in t2 or surrounding_am) else None)
            p1 = "pm" if "pm" in t1 else ("am" if "am" in t1 else p2)
            
            h1 = parse_hour_token(t1, default_period=p1)
            h2 = parse_hour_token(t2, default_period=p2)
            
            if h1 is not None and h2 is not None and h1 < h2 and h2 <= 24:
                # Contextual resolution: solar reduction during hours 1 to 5 always implies PM (13..17)
                if is_solar_context and h1 < 6 and h2 <= 7:
                    h1 += 12
                    h2 += 12
                return list(range(h1, h2))
                
    return None
