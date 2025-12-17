import io
from typing import Literal

from PIL import Image
from rembg import remove, new_session

ModelMode = Literal["quality", "fast"]

# Use lightweight model locally (no external API, no rate limits)
# u2netp is small (~5MB) and good for quick background removal
_rembg_session = new_session("u2netp")


async def remove_background(image_bytes: bytes, mode: ModelMode = "quality") -> bytes:
    """
    Local background removal via rembg (ONNX). Returns PNG bytes with alpha.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as im:
            im = im.convert("RGBA")
            result = remove(im, session=_rembg_session)
            buf = io.BytesIO()
            result.save(buf, format="PNG")
            return buf.getvalue()
    except Exception as e:  # noqa: BLE001
        print(f"[rembg] ERROR: {e}")
        raise

