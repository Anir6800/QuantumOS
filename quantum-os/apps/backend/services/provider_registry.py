from typing import Dict, List
from .providers.base import BaseProvider
from .providers.groq import GroqProvider
from .providers.openrouter import OpenRouterProvider
import time
import asyncio
import json
from pathlib import Path

class ProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseProvider] = {}
        
        # Register providers dynamically or statically
        for p_class in [GroqProvider, OpenRouterProvider]:
            p = p_class()
            self._providers[p.provider_name] = p

        # Role → preferred provider/model routing hints (ordered)
        # Mapping follows project routing guidance: DeepSeek → coding, Llama → planning, Mistral → evaluations, Qwen → UI generation
        self._role_routing = {
            "coding": [
                {"provider": "openrouter", "models": ["deepseek/deepseek-coder"]},
                {"provider": "groq", "models": ["mixtral-8x7b-32768"]},
            ],
            "planning": [
                {"provider": "groq", "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]},
            ],
            "evaluation": [
                {"provider": "groq", "models": ["gemma2-9b-it", "mixtral-8x7b-32768"]},
            ],
            "ui": [
                {"provider": "openrouter", "models": ["qwen/qwen2.5-coder-7b", "qwen/qwen3-32b"]},
            ],
        }

        # runtime metrics for providers: EWMA latency (ms), last_seen, failure count
        self._metrics: Dict[str, Dict] = {}
        for name in self._providers.keys():
            self._metrics[name] = {"ewma_ms": None, "last_seen": None, "failures": 0}
        self._metrics_lock = asyncio.Lock()
        # persistence path for metrics
        self._metrics_path = Path(__file__).parent / "provider_metrics.json"
        # attempt to load persisted metrics
        try:
            self._load_persisted_metrics()
        except Exception:
            # best-effort load; ignore failures
            pass

    def get_provider(self, name: str) -> BaseProvider:
        if name not in self._providers:
            raise ValueError(f"Provider {name} not found")
        return self._providers[name]

    def list_providers(self) -> List[str]:
        return list(self._providers.keys())

    def get_model_provider(self, model_name: str) -> BaseProvider:
        for provider in self._providers.values():
            if model_name in provider.supported_models:
                return provider
        raise ValueError(f"No provider found for model {model_name}")

    def route_for_role(self, role: str, preferred_models: List[str] | None = None) -> tuple[str, BaseProvider]:
        """Return a (model, provider) tuple best suited for the given role.

        The function consults routing hints and available providers. If `preferred_models` are provided,
        it will prefer those if supported.
        """
        hints = self._role_routing.get(role.lower(), [])

        # prefer user-provided models when possible
        if preferred_models:
            for m in preferred_models:
                try:
                    p = self.get_model_provider(m)
                    return (m, p)
                except Exception:
                    continue

        # consult role hints
        for hint in hints:
            provider_name = hint.get("provider")
            for m in hint.get("models", []) + (preferred_models or []):
                try:
                    p = self.get_provider(provider_name)
                    if m in p.supported_models:
                        return (m, p)
                except Exception:
                    continue

        # fallback: pick first supported model from registry
        for provider in self._providers.values():
            if provider.supported_models:
                return (provider.supported_models[0], provider)

        raise ValueError("No providers configured")

    async def record_latency(self, provider_name: str, latency_ms: float, success: bool = True):
        """Record provider latency and success/failure using an EWMA."""
        async with self._metrics_lock:
            m = self._metrics.get(provider_name)
            if m is None:
                self._metrics[provider_name] = {"ewma_ms": latency_ms, "last_seen": time.time(), "failures": 0 if success else 1}
                return

            alpha = 0.2
            if m["ewma_ms"] is None:
                m["ewma_ms"] = latency_ms
            else:
                m["ewma_ms"] = alpha * latency_ms + (1 - alpha) * m["ewma_ms"]
            m["last_seen"] = time.time()
            if not success:
                m["failures"] = m.get("failures", 0) + 1
            else:
                m["failures"] = 0
        # persist asynchronously (do not block the caller)
        try:
            asyncio.create_task(self._persist_metrics())
        except Exception:
            pass

    def get_metrics_snapshot(self) -> Dict[str, Dict]:
        return {k: {"ewma_ms": v.get("ewma_ms"), "last_seen": v.get("last_seen"), "failures": v.get("failures")} for k, v in self._metrics.items()}

    def _load_persisted_metrics(self):
        if not self._metrics_path.exists():
            return
        try:
            with open(self._metrics_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                for k, v in data.items():
                    # merge with defaults
                    if k in self._metrics:
                        self._metrics[k]["ewma_ms"] = v.get("ewma_ms", self._metrics[k].get("ewma_ms"))
                        self._metrics[k]["last_seen"] = v.get("last_seen", self._metrics[k].get("last_seen"))
                        self._metrics[k]["failures"] = v.get("failures", self._metrics[k].get("failures", 0))
        except Exception:
            # ignore malformed file
            return

    async def _persist_metrics(self):
        try:
            async with self._metrics_lock:
                tmp = {k: {"ewma_ms": v.get("ewma_ms"), "last_seen": v.get("last_seen"), "failures": v.get("failures")} for k, v in self._metrics.items()}
                # write atomically
                tmp_path = self._metrics_path.with_suffix(".tmp")
                with open(tmp_path, "w", encoding="utf-8") as fh:
                    json.dump(tmp, fh)
                tmp_path.replace(self._metrics_path)
        except Exception:
            # persist is best-effort
            return

    async def reset_metrics(self):
        async with self._metrics_lock:
            for k in list(self._metrics.keys()):
                self._metrics[k] = {"ewma_ms": None, "last_seen": None, "failures": 0}
        try:
            await self._persist_metrics()
        except Exception:
            pass

    async def promote_provider(self, provider_name: str, set_ewma_ms: float = 1.0):
        async with self._metrics_lock:
            if provider_name not in self._metrics:
                raise ValueError(f"Unknown provider {provider_name}")
            self._metrics[provider_name]["ewma_ms"] = set_ewma_ms
            self._metrics[provider_name]["failures"] = 0
            self._metrics[provider_name]["last_seen"] = time.time()
        try:
            await self._persist_metrics()
        except Exception:
            pass

    async def run_completion_for_role(self, role: str, messages, preferred_models: List[str] | None = None, **kwargs) -> str:
        """Select provider+model for `role`, call provider.complete and record latency/availability.

        This method centralizes selection, call execution, latency measurement, and fallback.
        """
        model, provider = self.route_for_role(role, preferred_models)
        start = time.time()
        try:
            # provider.complete implementations already use cached_call where appropriate
            result = await provider.complete(messages=messages, model=model, **kwargs)
            latency_ms = (time.time() - start) * 1000.0
            await self.record_latency(provider.provider_name, latency_ms, success=True)
            return result
        except Exception as e:
            latency_ms = (time.time() - start) * 1000.0
            try:
                await self.record_latency(provider.provider_name, latency_ms, success=False)
            except Exception:
                pass

            # Try fallback providers ordered by EWMA latency
            candidates = []
            for p_name, p in self._providers.items():
                if p_name == provider.provider_name:
                    continue
                m = self._metrics.get(p_name, {})
                ewma = m.get("ewma_ms") or 1e9
                candidates.append((ewma, p_name, p))
            candidates.sort(key=lambda x: x[0])

            for _, p_name, p in candidates:
                try:
                    fallback_model = p.supported_models[0] if p.supported_models else model
                    start2 = time.time()
                    res = await p.complete(messages=messages, model=fallback_model, **kwargs)
                    await self.record_latency(p_name, (time.time() - start2) * 1000.0, success=True)
                    return res
                except Exception:
                    await self.record_latency(p_name, (time.time() - start2) * 1000.0, success=False)
                    continue

            # re-raise original
            raise e

provider_registry = ProviderRegistry()
