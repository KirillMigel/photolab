from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Photolab API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """
    Health check endpoint.
    Background removal is now handled in the browser via @imgly/background-removal.
    """
    return {
        "status": "ok",
        "message": "Background removal moved to browser (client-side processing)"
    }


@app.get("/")
async def root():
    return {
        "service": "Photolab API",
        "version": "0.2.0",
        "note": "Image processing now happens in browser via WebAssembly"
    }
