import asyncio
import base64
import io
import uuid
from typing import List, Literal

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
from redis import Redis
from rq import Queue
from rq.job import Job

from app import replicate_client
from app.config import settings

Mode = Literal["quality", "fast"]

app = FastAPI(title="Background Remover (Replicate-backed)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_conn = Redis.from_url(settings.redis_url)
queue = Queue("rembg", connection=redis_conn)


def _ensure_size(file_bytes: bytes) -> None:
    limit = settings.max_file_size_mb * 1024 * 1024
    if len(file_bytes) > limit:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Limit {settings.max_file_size_mb} MB",
        )


def _maybe_resize(image: Image.Image) -> Image.Image:
    max_dim = settings.max_dimension
    if max(image.size) <= max_dim:
        return image
    image = image.copy()
    image.thumbnail((max_dim, max_dim))
    return image


async def _prepare_image(upload: UploadFile) -> bytes:
    content = await upload.read()
    _ensure_size(content)
    try:
        with Image.open(io.BytesIO(content)) as im:
            im = _maybe_resize(im)
            buf = io.BytesIO()
            im.save(buf, format="PNG")
            return buf.getvalue()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid image") from exc


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...), mode: Mode = "quality"):
    prepared = await _prepare_image(file)
    try:
        out_bytes = await replicate_client.remove_background(prepared, mode=mode)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Replicate error: {exc}") from exc
    
    # Возвращаем PNG напрямую
    return StreamingResponse(
        io.BytesIO(out_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{uuid.uuid4()}.png"'},
    )


@app.post("/batch")
async def batch(files: List[UploadFile] = File(...), mode: Mode = "quality"):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    payloads = []
    for f in files:
        prepared = await _prepare_image(f)
        payloads.append({"filename": f.filename or "image.png", "data": prepared})

    job = queue.enqueue("worker.process_batch", payloads, mode, job_timeout=600)
    return {"job_id": job.id, "status": job.get_status()}


@app.get("/batch/{job_id}")
async def batch_status(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except Exception:
        raise HTTPException(status_code=404, detail="Job not found")

    status = job.get_status()
    meta = job.meta or {}
    if status == "finished":
        results = job.return_value or meta.get("results") or []
        return {"status": status, "results": results}
    return {"status": status, "progress": meta.get("progress")}

