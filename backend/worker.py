import asyncio
import base64
from typing import Literal

from redis import Redis
from rq import Connection, Worker, get_current_job

from app import replicate_client
from app.config import settings

Mode = Literal["quality", "fast"]


def process_batch(file_payloads: list[dict], mode: Mode = "quality"):
    """
    Sequentially process a batch using Replicate; returns data URLs.
    """
    job = get_current_job()
    results: list[dict] = []
    total = len(file_payloads)

    for idx, payload in enumerate(file_payloads, start=1):
        data: bytes = payload["data"]
        filename: str = payload.get("filename") or "image.png"

        out_bytes = asyncio.run(replicate_client.remove_background(data, mode=mode))
        
        # Кодируем результат как data URL
        data_url = "data:image/png;base64," + base64.b64encode(out_bytes).decode()
        
        results.append({
            "filename": filename,
            "data_url": data_url,
        })

        if job:
            job.meta["progress"] = f"{idx}/{total}"
            job.save_meta()

    if job:
        job.meta["results"] = results
        job.save_meta()
    return results


def main():
    redis_conn = Redis.from_url(settings.redis_url)
    with Connection(redis_conn):
        worker = Worker(["rembg"])
        worker.work()


if __name__ == "__main__":
    main()

