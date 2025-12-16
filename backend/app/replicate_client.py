import asyncio
import io
from typing import Literal

import httpx
import replicate

from app.config import settings


ModelMode = Literal["quality", "fast"]

# Fallback model list if primary slug fails (404)
FALLBACK_MODELS = [
    "lucataco/remove-bg",
    "cjwbw/rembg",
    "jagilley/rembg",  # additional known rembg fork; will be skipped if not found
]


def _select_model(mode: ModelMode) -> str:
    return (
        settings.replicate_model_fast
        if mode == "fast"
        else settings.replicate_model_quality
    )


async def remove_background(image_bytes: bytes, mode: ModelMode = "quality") -> bytes:
    """
    Calls Replicate model and returns PNG bytes.
    """
    model_candidates = []

    primary = _select_model(mode)
    model_candidates.append(primary)
    # Add fallbacks if not already in list
    for m in FALLBACK_MODELS:
        if m not in model_candidates:
            model_candidates.append(m)

    last_error: Exception | None = None

    for model in model_candidates:
        print(f"[Replicate] Trying model: {model}")
        print(f"[Replicate] Image size: {len(image_bytes)} bytes")

        def _run_sync() -> str | list[str] | None:
            try:
                result = replicate.run(
                    model,
                    input={
                        "image": io.BytesIO(image_bytes),
                    },
                )
                print(f"[Replicate] Result type: {type(result)}, value: {result}")
                return result
            except Exception as e:
                print(f"[Replicate] ERROR in replicate.run (model={model}): {e}")
                raise

        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(None, _run_sync)
        except Exception as e:  # noqa: BLE001
            last_error = e
            # If 404, try next model
            if "404" in str(e):
                continue
            # Other errors - stop
            raise

        # Normalize result to a single URL
        url: str | None = None
        if isinstance(result, list) and result:
            url = result[0]
        elif isinstance(result, str):
            url = result

        if not url:
            print(f"[Replicate] ERROR: Empty or invalid result: {result}")
            last_error = RuntimeError("Empty response from Replicate")
            continue

        print(f"[Replicate] Downloading from: {url}")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            print(f"[Replicate] Downloaded {len(resp.content)} bytes using model {model}")
            return resp.content

    # If we exhausted all models
    if last_error:
        raise last_error
    raise RuntimeError("All Replicate models failed")

