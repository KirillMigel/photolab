# Background removal moved to frontend (browser-based)
# This file is kept for compatibility but not used

async def remove_background(image_bytes: bytes, mode: str = "quality") -> bytes:
    """
    Background removal is now handled in the browser via @imgly/background-removal.
    This function is deprecated and will raise an error if called.
    """
    raise NotImplementedError(
        "Background removal has moved to the browser. "
        "Use the frontend @imgly/background-removal library instead."
    )
