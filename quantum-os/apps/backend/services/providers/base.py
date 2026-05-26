import abc
import time
import asyncio
import logging
from typing import AsyncGenerator, List, Dict, Any
import httpx
from core.exceptions import ProviderAuthenticationError

logger = logging.getLogger(__name__)

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
                    logger.error(f"[{self.provider_name}] Authentication failed (401). Invalid API key.")
                    raise ProviderAuthenticationError(f"Invalid API key for {self.provider_name}")
                
                retries += 1
                if retries > self.max_retries:
                    logger.error(f"[{self.provider_name}] Max retries exceeded. Error: {str(e)}")
                    raise e
                sleep_time = 2 ** retries
                logger.warning(f"[{self.provider_name}] Request failed: {str(e)}. Retrying in {sleep_time}s...")
                await asyncio.sleep(sleep_time)
