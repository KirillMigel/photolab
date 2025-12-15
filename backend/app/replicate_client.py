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

    def _run_sync() -> str | list[str] | None:
        # replicate.run may return a URL string or list of URLs; we normalize later.
        return replicate.run(
            model,
            input={
                "image": io.BytesIO(image_bytes),
                # Models typically allow "output_format": "png" or mask settings; keep defaults for MVP.
            },
        )

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _run_sync)

    # Normalize result to a single URL
    url: str | None = None
    if isinstance(result, list) and result:
        url = result[0]
    elif isinstance(result, str):
        url = result

    if not url:
        raise RuntimeError("Empty response from Replicate")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content

