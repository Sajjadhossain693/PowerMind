import json
import logging
import time
from typing import List, Optional, Tuple, Dict, Any
from app.config import settings
from app.llm.client import BaseLLMClient, create_llm_client, MockDeterministicLLMClient
from app.llm.prompts import SYSTEM_PROMPT, REPAIR_PROMPT_TEMPLATE
from app.llm.parser import parse_and_validate_llm_output, LLMParseError
from app.schemas import DirectiveInterpretationItem, LLMRuntimeConfig

logger = logging.getLogger("powermind.llm")

class BoundedInterpretationCache:
    """Bounded in-memory cache for interpreted notes."""
    def __init__(self, max_size: int = 1024):
        self.max_size = max_size
        self._cache: Dict[str, DirectiveInterpretationItem] = {}

    def _make_key(self, note: str, model: str) -> str:
        return f"{model.lower()}::{note.strip().lower()}"

    def get(self, note: str, model: str) -> Optional[DirectiveInterpretationItem]:
        key = self._make_key(note, model)
        return self._cache.get(key)

    def set(self, note: str, model: str, item: DirectiveInterpretationItem) -> None:
        if len(self._cache) >= self.max_size:
            # Evict first inserted key (FIFO)
            first_key = next(iter(self._cache))
            del self._cache[first_key]
        key = self._make_key(note, model)
        self._cache[key] = item

_global_cache = BoundedInterpretationCache()

class LLMInterpreter:
    def __init__(self, client: Optional[BaseLLMClient] = None):
        self.client = client or create_llm_client()

    async def interpret_notes(
        self,
        operator_notes: List[str],
        battery_capacity_kwh: float,
        runtime_config: Optional[LLMRuntimeConfig] = None
    ) -> Tuple[List[DirectiveInterpretationItem], Dict[str, Any]]:
        """
        Interprets natural language notes into structured directives.
        Guarantees 1-to-1 sequential mapping and strict validation.
        """
        start_time = time.time()
        client = self.client
        if runtime_config and (runtime_config.provider or runtime_config.api_key or runtime_config.model):
            client = create_llm_client(
                provider=runtime_config.provider,
                model=runtime_config.model,
                api_key=runtime_config.api_key
            )

        model_name = getattr(client, "model", "mock-deterministic")
        metadata = {
            "model": model_name,
            "provider": type(client).__name__,
            "repair_triggered": False,
            "cache_hits": 0,
            "fallback_used": False,
        }

        # Check cache if all notes are cached
        if settings.CACHE_ENABLED:
            cached_items: List[DirectiveInterpretationItem] = []
            all_cached = True
            for idx, note in enumerate(operator_notes):
                cached = _global_cache.get(note, model_name)
                if cached:
                    # Deep copy and adjust note_index
                    item = cached.model_copy(update={"note_index": idx})
                    cached_items.append(item)
                else:
                    all_cached = False
                    break

            if all_cached and len(cached_items) == len(operator_notes):
                metadata["cache_hits"] = len(operator_notes)
                metadata["latency_ms"] = round((time.time() - start_time) * 1000, 2)
                return cached_items, metadata

        # Construct prompt
        notes_json = json.dumps(operator_notes, indent=2)
        user_prompt = f"Interpret the following operator notes:\n{notes_json}"

        raw_output = ""
        try:
            raw_output = await client.generate(SYSTEM_PROMPT, user_prompt)
            interpretations = parse_and_validate_llm_output(
                raw_output,
                expected_notes_count=len(operator_notes),
                battery_capacity_kwh=battery_capacity_kwh
            )
        except Exception as first_error:
            logger.warning(f"Primary LLM interpretation failed: {first_error}. Output: {raw_output[:200]}")
            
            # Attempt bounded repair call (max 1 retry)
            metadata["repair_triggered"] = True
            repair_prompt = REPAIR_PROMPT_TEMPLATE.format(
                error_details=str(first_error),
                previous_output=raw_output[:1000],
                operator_notes=notes_json
            )

            try:
                repair_output = await client.generate(SYSTEM_PROMPT, repair_prompt)
                interpretations = parse_and_validate_llm_output(
                    repair_output,
                    expected_notes_count=len(operator_notes),
                    battery_capacity_kwh=battery_capacity_kwh
                )
            except Exception as repair_error:
                logger.error(f"Repair attempt failed: {repair_error}. Engaging high-confidence deterministic fallback.")
                metadata["fallback_used"] = True
                mock_client = MockDeterministicLLMClient(model="fallback-deterministic")
                fallback_output = await mock_client.generate(SYSTEM_PROMPT, user_prompt)
                interpretations = parse_and_validate_llm_output(
                    fallback_output,
                    expected_notes_count=len(operator_notes),
                    battery_capacity_kwh=battery_capacity_kwh
                )

        # Store into cache
        if settings.CACHE_ENABLED:
            for note, item in zip(operator_notes, interpretations):
                _global_cache.set(note, model_name, item)

        metadata["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        return interpretations, metadata
