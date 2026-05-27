from fastapi import APIRouter

from services.provider_registry import provider_registry

router = APIRouter(prefix="/api/v1/providers", tags=["providers"])


@router.get("")
async def list_providers():
    return {"providers": provider_registry.list_providers()}


@router.get("/{provider_name}/models")
async def list_provider_models(provider_name: str):
    provider = provider_registry.get_provider(provider_name)
    return {
        "provider": provider_name,
        "models": [
            {
                "id": model,
                "label": model.replace("-", " ").replace("/", " ").title(),
                "provider": provider.provider_name,
            }
            for model in provider.supported_models
        ],
    }


@router.get("/metrics")
async def providers_metrics():
    """Return runtime metrics for configured providers (EWMA latency, last_seen, failures)."""
    return {"metrics": provider_registry.get_metrics_snapshot()}


@router.post("/metrics/reset")
async def providers_metrics_reset():
    """Reset all provider runtime metrics to defaults."""
    await provider_registry.reset_metrics()
    return {"status": "ok"}


@router.post("/metrics/promote")
async def providers_metrics_promote(provider_name: str):
    """Promote a provider by setting its EWMA latency to a very low value (operator-only).

    Query param: `provider_name` — provider id to promote.
    """
    await provider_registry.promote_provider(provider_name)
    return {"status": "ok", "promoted": provider_name}
