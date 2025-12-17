import asyncio
import base64
import io
import logging
from typing import Literal

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ModelMode = Literal["quality", "fast"]

# Direct API call without replicate library
REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"


async def remove_background(image_bytes: bytes, mode: ModelMode = "quality") -> bytes:
    """
    Calls Replicate API directly and returns PNG bytes.
    """
    token = settings.replicate_api_token
    masked_token = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else "***"
    print(f"[DEBUG] Using Replicate token: {masked_token}")
    
    # Encode image to base64 data URI
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64_image}"
    
    # Use a known working model version
    # modnet: https://replicate.com/pollinations/modnet
    model_version = "da7d45f3b836795f945f221fc0b01a6d3ab7f5e163f13208948ad436001e2255"
    
    print(f"[DEBUG] Using model version: {model_version[:16]}...")
    print(f"[DEBUG] Image size: {len(image_bytes)} bytes")
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "version": model_version,
        "input": {
            "image": data_uri,
        },
    }
    
    async with httpx.AsyncClient(timeout=120) as client:
        # Create prediction
        print(f"[DEBUG] Creating prediction...")
        resp = await client.post(REPLICATE_API_URL, json=payload, headers=headers)
        print(f"[DEBUG] Create response status: {resp.status_code}")
        
        if resp.status_code != 201:
            print(f"[DEBUG] Create error: {resp.text}")
            raise RuntimeError(f"Replicate API error: {resp.status_code} - {resp.text}")
        
        prediction = resp.json()
        prediction_id = prediction["id"]
        get_url = prediction["urls"]["get"]
        print(f"[DEBUG] Prediction created: {prediction_id}")
        
        # Poll for completion
        for _ in range(60):  # Max 60 attempts, ~2 min
            await asyncio.sleep(2)
            poll_resp = await client.get(get_url, headers=headers)
            poll_data = poll_resp.json()
            status = poll_data["status"]
            print(f"[DEBUG] Prediction status: {status}")
            
            if status == "succeeded":
                output = poll_data["output"]
                print(f"[DEBUG] Output: {output}")
                # Output is URL to result image
                if isinstance(output, list):
                    output = output[0]
                
                # Download result
                img_resp = await client.get(output)
                img_resp.raise_for_status()
                print(f"[DEBUG] Downloaded result: {len(img_resp.content)} bytes")
                return img_resp.content
            
            elif status == "failed":
                error = poll_data.get("error", "Unknown error")
                print(f"[DEBUG] Prediction failed: {error}")
                raise RuntimeError(f"Replicate prediction failed: {error}")
            
            elif status == "canceled":
                raise RuntimeError("Replicate prediction was canceled")
        
        raise RuntimeError("Replicate prediction timed out")
