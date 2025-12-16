import asyncio
import io
from typing import Literal

import httpx
import replicate

from app.config import settings


ModelMode = Literal["quality", "fast"]


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
    model = _select_model(mode)
    print(f"[Replicate] Using model: {model}")
    print(f"[Replicate] Image size: {len(image_bytes)} bytes")

    def _run_sync() -> str | list[str] | None:
        try:
            print(f"[Replicate] Calling replicate.run...")
            result = replicate.run(
                model,
                input={
                    "image": io.BytesIO(image_bytes),
                },
            )
            print(f"[Replicate] Result type: {type(result)}, value: {result}")
            return result
        except Exception as e:
            print(f"[Replicate] ERROR in replicate.run: {e}")
            raise

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _run_sync)

    # Normalize result to a single URL
    url: str | None = None
    if isinstance(result, list) and result:
        url = result[0]
    elif isinstance(result, str):
        url = result

    if not url:
        print(f"[Replicate] ERROR: Empty or invalid result: {result}")
        raise RuntimeError("Empty response from Replicate")

    print(f"[Replicate] Downloading from: {url}")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        print(f"[Replicate] Downloaded {len(resp.content)} bytes")
        return resp.content

