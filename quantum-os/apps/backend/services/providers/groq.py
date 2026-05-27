import json
import time
import httpx
from typing import AsyncGenerator, List, Dict

from .base import BaseProvider
from core.config import config
from core.logger import get_logger

logger = get_logger(__name__)


class GroqProvider(BaseProvider):
    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def supported_models(self) -> List[str]:
        return ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {config.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

    async def complete(self, messages: List[Dict[str, str]], model: str, **kwargs) -> str:
        async def _call():
            payload = {"model": model, "messages": messages, "stream": False, **kwargs}
            start_time = time.time()
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=self._get_headers(), json=payload)
                response.raise_for_status()
                data = response.json()
                usage = data.get("usage", {})
                tokens_in = usage.get("prompt_tokens", 0)
                tokens_out = usage.get("completion_tokens", 0)
                logger.log_api_call(self.provider_name, model, tokens_in, tokens_out, (time.time() - start_time) * 1000)
                return data["choices"][0]["message"]["content"]

        # Deduplicate identical completion requests and cache results
        return await self.cached_call(messages, model, lambda: self._retry_with_backoff(_call), extra=kwargs)

    async def stream(self, messages: List[Dict[str, str]], model: str, **kwargs) -> AsyncGenerator[str, None]:
        payload = {"model": model, "messages": messages, "stream": True, **kwargs}
        start_time = time.time()

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", headers=self._get_headers(), json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            chunk = data["choices"][0].get("delta", {}).get("content", "")
                            if chunk:
                                yield chunk
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

        logger.log_api_call(self.provider_name, model, 0, 0, (time.time() - start_time) * 1000)
