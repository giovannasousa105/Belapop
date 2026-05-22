"""
BelaPop Skin CV Service — FastAPI entry point.

Security notes:
  - Pixel data and file paths are never logged.
  - Image bytes are freed immediately after analysis.
  - X-Image-Retained: false header signals compliance to callers.
  - Endpoint is authenticated via INTERNAL_API_KEY header.
  - Docs (Swagger/ReDoc) are disabled — internal service only.
"""
from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Annotated, AsyncGenerator

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Response, UploadFile
from PIL import Image
from pydantic import BaseModel

from analyzer import AnalysisRequest, AnalysisResult, SkinAnalyzer
from face_detector import FaceDetector
from feature_extractor import FeatureExtractor

# ---------------------------------------------------------------------------
# Logging (structured; never include pixel data)
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config from environment
# ---------------------------------------------------------------------------

_MAX_FILE_BYTES: int = 10 * 1024 * 1024  # 10 MB
_ALLOWED_TYPES: frozenset[str] = frozenset({"image/jpeg", "image/png"})
_INTERNAL_API_KEY: str = os.environ.get("INTERNAL_API_KEY", "")
_MODEL_PATH: Path = Path(os.environ.get("MODEL_PATH", "models/skin_analysis.onnx"))

# ---------------------------------------------------------------------------
# Global state — set once in lifespan, read-only after
# ---------------------------------------------------------------------------

_analyzer: SkinAnalyzer | None = None


# ---------------------------------------------------------------------------
# Lifespan: load models + warmup
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global _analyzer

    logger.info("Initialising face detector...")
    face_detector = FaceDetector()

    logger.info("Initialising feature extractor (model_path=%s)...", _MODEL_PATH)
    feature_extractor = FeatureExtractor(_MODEL_PATH)

    _analyzer = SkinAnalyzer(face_detector, feature_extractor)

    # ── Warmup: force ONNX graph compilation + MediaPipe graph init ──────────
    logger.info("Running warmup inference...")
    try:
        warmup_img = Image.new("RGB", (224, 224), color=(190, 160, 140))
        buf = BytesIO()
        warmup_img.save(buf, format="JPEG", quality=85)
        await _analyzer.analyze(
            AnalysisRequest(image_bytes=buf.getvalue(), scan_id="__warmup__", focos=[])
        )
        logger.info("Warmup complete (model_version=%s).", feature_extractor.model_version)
    except Exception as exc:
        logger.warning("Warmup failed (non-fatal): %s", exc)

    yield

    logger.info("Shutting down.")
    _analyzer = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BelaPop Skin CV",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,   # disable public Swagger
    redoc_url=None,
    openapi_url=None,
)


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------


async def _verify_api_key(
    x_internal_key: Annotated[str | None, Header(alias="X-Internal-Key")] = None,
) -> None:
    if not _INTERNAL_API_KEY:
        return  # key not configured — allow (dev/test mode)
    if x_internal_key != _INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class FaceBbox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class SkinScores(BaseModel):
    acne: float
    poros: float
    textura: float
    oleosidade: float
    pigmentacao: float
    vermelhidao: float
    ressecamento: float


class AnalyzeResponse(BaseModel):
    scan_id: str
    face_detectada: bool
    face_bbox: FaceBbox | None
    fitzpatrick_estimado: int
    scores: SkinScores
    confidence_geral: float
    flags: list[str]
    modelo_versao: str
    duracao_ms: int


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    response: Response,
    image: Annotated[UploadFile, File(description="Face photo (JPEG/PNG, ≤10 MB)")],
    scan_id: Annotated[str, Form(description="Unique identifier for this scan")],
    focos: list[str] = Form(default=[]),
    _auth: None = Depends(_verify_api_key),
) -> AnalyzeResponse:
    """
    Analyse a face image and return SkinFeatureVector.

    - Image is processed in memory and never persisted.
    - Always returns HTTP 200; errors are encoded as `flags`.
    - X-Image-Retained: false header confirms LGPD compliance.
    """
    t0 = time.monotonic()

    # ── Input validation (422 on bad request, before any processing) ─────────
    content_type = (image.content_type or "").split(";")[0].strip().lower()
    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Tipo não suportado: '{content_type}'. Use image/jpeg ou image/png.",
        )

    image_bytes = await image.read()
    await image.close()

    if len(image_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"Imagem excede {_MAX_FILE_BYTES // (1024 * 1024)} MB.",
        )

    # ── Analysis ─────────────────────────────────────────────────────────────
    response.headers["X-Image-Retained"] = "false"

    if _analyzer is None:
        # Should never happen in normal operation — lifespan guarantees init
        dur = int((time.monotonic() - t0) * 1000)
        return AnalyzeResponse(
            scan_id=scan_id,
            face_detectada=False,
            face_bbox=None,
            fitzpatrick_estimado=3,
            scores=SkinScores(
                acne=0.0, poros=0.0, textura=0.0, oleosidade=0.0,
                pigmentacao=0.0, vermelhidao=0.0, ressecamento=0.0,
            ),
            confidence_geral=0.0,
            flags=["SERVICE_UNAVAILABLE"],
            modelo_versao="unavailable",
            duracao_ms=dur,
        )

    result: AnalysisResult = await _analyzer.analyze(
        AnalysisRequest(image_bytes=image_bytes, scan_id=scan_id, focos=focos or [])
    )

    # Explicit release — belt-and-suspenders alongside GC
    del image_bytes

    scores_dict = result.scores
    return AnalyzeResponse(
        scan_id=result.scan_id,
        face_detectada=result.face_detectada,
        face_bbox=FaceBbox(**result.face_bbox) if result.face_bbox else None,
        fitzpatrick_estimado=result.fitzpatrick_estimado,
        scores=SkinScores(
            acne=scores_dict.get("acne", 0.0),
            poros=scores_dict.get("poros", 0.0),
            textura=scores_dict.get("textura", 0.0),
            oleosidade=scores_dict.get("oleosidade", 0.0),
            pigmentacao=scores_dict.get("pigmentacao", 0.0),
            vermelhidao=scores_dict.get("vermelhidao", 0.0),
            ressecamento=scores_dict.get("ressecamento", 0.0),
        ),
        confidence_geral=result.confidence_geral,
        flags=result.flags,
        modelo_versao=result.modelo_versao,
        duracao_ms=result.duracao_ms,
    )


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, object]:
    """Liveness probe — returns 200 when service is ready."""
    modelo_carregado = _analyzer is not None
    version = _analyzer._extractor.model_version if _analyzer else "not_loaded"
    return {
        "status": "ok",
        "modelo_carregado": modelo_carregado,
        "model_version": version,
    }
