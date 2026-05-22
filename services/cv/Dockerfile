FROM python:3.11-slim

# System deps for MediaPipe (needs libGL for face mesh) and ONNX Runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgl1 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Model placeholder — actual .onnx files are mounted at runtime (DVC / S3)
RUN mkdir -p /app/models

# Non-root user
RUN useradd --system --shell /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser

# Force CPU-only MediaPipe — no EGL/GPU in container
ENV MP_DISABLE_GPU=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Single worker: model is in-process; asyncio.to_thread handles concurrency
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
