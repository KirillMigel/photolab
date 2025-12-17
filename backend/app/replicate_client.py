import asyncio
import io
import logging
from typing import Literal

import httpx
import replicate

from app.config import settings

logger = logging.getLogger(__name__)

ModelMode = Literal["quality", "fast"]


def _select_model(mode: ModelMode) -> str:
    model = (
        settings.replicate_model_fast
        if mode == "fast"
        else settings.replicate_model_quality
    )
    logger.info(f"Selected Replicate model: {model} for mode: {mode}")
    return model


async def remove_background(image_bytes: bytes, mode: ModelMode = "quality") -> bytes:
    """
    Calls Replicate model and returns PNG bytes.
    """
    # Use specific working model version
    model = "pollinations/modnet"  # Proven to work, 1.9M runs
    
    # Debug output
    token = settings.replicate_api_token
    masked_token = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else "***"
    print(f"[DEBUG] Using Replicate token: {masked_token}")
    print(f"[DEBUG] Using model: {model}")

    def _run_sync() -> str | list[str] | None:
        try:
            print(f"[DEBUG] Calling Replicate.run...")
            client = replicate.Client(api_token=settings.replicate_api_token)
            result = client.run(
                model,
                input={
                    "image": io.BytesIO(image_bytes),
                },
            )
            print(f"[DEBUG] Replicate.run succeeded, result type: {type(result)}")
            return result
        except Exception as e:
            print(f"[DEBUG] Error calling Replicate.run: {e}")
            logger.error(f"Error calling Replicate.run: {e}", exc_info=True)
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
        raise RuntimeError("Empty or invalid response from Replicate")

    logger.info(f"Downloading result from URL: {url}")
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            logger.info(f"Successfully downloaded result from {url}")
            return resp.content
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error downloading result from {url}: "
                f"{e.response.status_code} - {e.response.text}",
                exc_info=True,
            )
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error downloading result from {url}: {e}", exc_info=True)
            raise

