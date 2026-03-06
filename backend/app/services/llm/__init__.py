"""LLM provider abstraction — factory for text generation clients."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.services.llm.base import LLMClient
from app.services.llm.gemini_adapter import GeminiClient
from app.services.llm.zhipu_adapter import ZhipuClient

if TYPE_CHECKING:
    from app.config import Settings

__all__ = ["LLMClient", "get_llm_client"]

_TASK_SETTING_MAP = {
    "filter": "llm_provider_filter",
    "keywords": "llm_provider_keywords",
    "title": "llm_provider_title",
}


def get_llm_client(settings: Settings, task: str) -> LLMClient:
    """Return an LLMClient for the given task based on settings."""
    attr = _TASK_SETTING_MAP.get(task)
    if not attr:
        raise ValueError(f"Unknown LLM task: {task!r}")

    provider = getattr(settings, attr)

    if provider == "gemini":
        if not settings.gemini_api_key:
            raise ValueError(f"gemini_api_key required for {task} (llm_provider={provider})")
        return GeminiClient(settings.gemini_api_key)

    if provider == "zhipu":
        if not settings.zhipu_api_key:
            raise ValueError(f"zhipu_api_key required for {task} (llm_provider={provider})")
        return ZhipuClient(settings.zhipu_api_key)

    raise ValueError(f"Unknown LLM provider: {provider!r} for task {task!r}")
