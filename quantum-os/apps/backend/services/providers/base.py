import abc
import asyncio
import httpx
from typing import AsyncGenerator, List, Dict

from core.exceptions import ProviderAuthenticationError
from core.logger import get_logger

logger = get_logger(__name__)


class BaseProvider(abc.ABC):
    max_retries: int = 3
    # Simple in-memory LRU cache for completions to avoid repeated identical API calls
    cache_max_size: int = 512

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

    # --- caching & inflight request coalescing helpers ---
    def __init__(self, *args, **kwargs):
        super().__init__()
        self._cache: Dict[str, str] = {}
        self._cache_order = []
        self._cache_lock = asyncio.Lock()
        self._inflight: Dict[str, asyncio.Future] = {}

    def _make_cache_key(self, messages: List[Dict[str, str]], model: str, extra: Dict) -> str:
        import json, hashlib

        try:
            s = json.dumps({"m": messages, "model": model, "extra": extra}, sort_keys=True, ensure_ascii=False)
        except Exception:
            s = f"{model}:{str(messages)}:{str(extra)}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    async def cached_call(self, messages: List[Dict[str, str]], model: str, call_factory, extra: Dict = None, ttl: int = 300) -> str:
        """Call `call_factory()` (a no-arg coroutine) but first check cache and dedupe inflight identical calls.

        `extra` can include kwargs that affect the call (like temperature, max_tokens).
        """
        extra = extra or {}
        key = self._make_cache_key(messages, model, extra)

        # fast path: check cache
        async with self._cache_lock:
            if key in self._cache:
                # move to end for LRU
                try:
                    self._cache_order.remove(key)
                except ValueError:
                    pass
                self._cache_order.append(key)
                return self._cache[key]

            # if an identical call is already in flight, wait for it
            fut = self._inflight.get(key)
            if fut:
                try:
                    return await asyncio.shield(fut)
                except Exception:
                    # if the inflight failed, continue to attempt a new call
                    pass

            # create a future placeholder to coalesce inflight callers
            loop = asyncio.get_event_loop()
            fut = loop.create_future()
            self._inflight[key] = fut

        try:
            result = await call_factory()

            async with self._cache_lock:
                # store result in cache and maintain LRU order
                self._cache[key] = result
                self._cache_order.append(key)
                if len(self._cache_order) > self.cache_max_size:
                    oldest = self._cache_order.pop(0)
                    self._cache.pop(oldest, None)

                # fulfill inflight future
                if not fut.done():
                    fut.set_result(result)

            return result
        except Exception as e:
            async with self._cache_lock:
                if not fut.done():
                    fut.set_exception(e)
            raise
        finally:
            async with self._cache_lock:
                self._inflight.pop(key, None)
