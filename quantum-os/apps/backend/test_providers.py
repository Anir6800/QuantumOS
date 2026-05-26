import asyncio
import logging
from services.provider_registry import provider_registry
from services.providers.openrouter import OpenRouterProvider
import httpx
from core.exceptions import QuantumOSException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_providers():
    messages = [{"role": "user", "content": "Hello! Reply with exactly 'Hi!'"}]
    
    # 1. GroqProvider.complete()
    groq = provider_registry.get_provider("groq")
    print("\n--- Testing GroqProvider.complete() ---")
    try:
        response = await groq.complete(messages, model="llama-3.3-70b-versatile")
        print(f"✅ Groq response: {response}")
        assert isinstance(response, str)
    except Exception as e:
        print(f"❌ Groq failed: {str(e)}")

    # 2. OpenRouterProvider.stream()
    openrouter = provider_registry.get_provider("openrouter")
    print("\n--- Testing OpenRouterProvider.stream() ---")
    stream_msgs = [{"role": "user", "content": "Write a 5-line python script."}]
    try:
        chunks = []
        async for chunk in openrouter.stream(stream_msgs, model="qwen/qwen-2.5-coder-32b-instruct"):
            chunks.append(chunk)
            print(f"Chunk: {chunk!r}")
        print(f"✅ OpenRouter stream yielded {len(chunks)} chunks")
        assert len(chunks) >= 3
    except Exception as e:
        print(f"❌ OpenRouter stream failed: {str(e)}")

    # 3. ProviderRegistry.get_model_provider()
    print("\n--- Testing get_model_provider() ---")
    provider = provider_registry.get_model_provider("deepseek/deepseek-coder")
    print(f"Got provider: {provider.provider_name}")
    assert isinstance(provider, OpenRouterProvider)
    print("✅ ProviderRegistry routing works")

    # 4. API key errors raise a clear exception
    print("\n--- Testing API key errors ---")
    # Temporarily invalidate key
    import core.config
    old_key = core.config.config.GROQ_API_KEY
    core.config.config.GROQ_API_KEY = "invalid_key"
    try:
        await groq.complete(messages, model="llama-3.3-70b-versatile")
        print("❌ Expected exception, but got success")
    except Exception as e:
        print(f"✅ API key error raised exception: {type(e).__name__} - {str(e)}")
    finally:
        core.config.config.GROQ_API_KEY = old_key

if __name__ == "__main__":
    asyncio.run(test_providers())
