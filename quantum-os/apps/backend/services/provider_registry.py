from typing import Dict, List
from .providers.base import BaseProvider
from .providers.groq import GroqProvider
from .providers.openrouter import OpenRouterProvider

class ProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseProvider] = {}
        
        # Register providers dynamically or statically
        for p_class in [GroqProvider, OpenRouterProvider]:
            p = p_class()
            self._providers[p.provider_name] = p

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

provider_registry = ProviderRegistry()
