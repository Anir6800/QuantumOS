import abc
import asyncio
import httpx
from typing import AsyncGenerator, List, Dict

from core.exceptions import ProviderAuthenticationError
from core.logger import get_logger

logger = get_logger(__name__)


class BaseProvider(abc.ABC):
    max_retries: int = 3

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abc.abstractmethod
    def supported_models(self) -> List[str]:
        pass

    @abc.abstractmethod
    async def complete(self, messages: List[Dict[str, str]], model: str, **kwargs) -> str:
        pass

    @abc.abstractmethod
    async def stream(self, messages: List[Dict[str, str]], model: str, **kwargs) -> AsyncGenerator[str, None]:
        pass

    async def _retry_with_backoff(self, coro_func, *args, **kwargs):
        retries = 0
        while True:
            try:
                return await coro_func(*args, **kwargs)
            except Exception as e:
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 401:
                    logger.error("provider_auth_failed", provider=self.provider_name, status_code=401)
                    raise ProviderAuthenticationError(f"Invalid API key for {self.provider_name}")

                retries += 1
                if retries > self.max_retries:
                    logger.error("provider_max_retries_exceeded", provider=self.provider_name, error=str(e))
                    raise e
                sleep_time = 2 ** retries
                logger.warn("provider_retry", provider=self.provider_name, error=str(e), sleep_seconds=sleep_time)
                await asyncio.sleep(sleep_time)
