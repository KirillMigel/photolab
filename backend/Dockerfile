FROM python:3.11-slim

WORKDIR /app

# Install system deps (Pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir rembg onnxruntime

COPY . /app

EXPOSE 8000
# Shell form для правильной подстановки $PORT от Railway
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

