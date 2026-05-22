"""
SkinAnalyzer — orchestrates the full analysis pipeline.

Pipeline order:
  1. Decode image (in-memory only, never touches disk)
  2. Quality pre-checks (brightness, blur)
  3. Face detection + landmark extraction (MediaPipe)
  4. Face-coverage quality check (needs bbox)
  5. Zone-based ONNX/heuristic inference
  6. Fitzpatrick phototype estimation
  7. Build response dict

Any exception at any stage is caught and converted to a flag —
the caller always receives a structured dict, never an exception.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image

from face_detector import FaceDetectionResult, FaceDetector
from feature_extractor import SCORE_NAMES, FeatureExtractor
from fitzpatrick import estimate_fitzpatrick
from image_quality import check_image_quality

logger = logging.getLogger(__name__)

_FACE_MIN_CONFIDENCE = 0.70
_LOW_CONFIDENCE_THRESHOLD = 0.55

_EMPTY_SCORES: dict[str, float] = {name: 0.0 for name in SCORE_NAMES}
_NEUTRAL_SCORES: dict[str, float] = {name: 0.5 for name in SCORE_NAMES}


# ---------------------------------------------------------------------------
# Public dataclasses
# ---------------------------------------------------------------------------


@dataclass
class AnalysisRequest:
    image_bytes: bytes
    scan_id: str
    focos: list[str]


@dataclass
class AnalysisResult:
    scan_id: str
    face_detectada: bool
    face_bbox: dict[str, int] | None
    fitzpatrick_estimado: int
    scores: dict[str, float]
    confidence_geral: float
    flags: list[str]
    modelo_versao: str
    duracao_ms: int


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------


class SkinAnalyzer:
    def __init__(self, face_detector: FaceDetector, feature_extractor: FeatureExtractor) -> None:
        self._detector = face_detector
        self._extractor = feature_extractor

    async def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        """
        Async entry point — runs CPU-bound work in a thread pool.

        Never raises: all errors become flags in the result.
        """
        t0 = time.monotonic()
        raw = await asyncio.to_thread(self._run, request)
        duracao_ms = int((time.monotonic() - t0) * 1000)

        return AnalysisResult(
            scan_id=raw["scan_id"],
            face_detectada=raw["face_detectada"],
            face_bbox=raw["face_bbox"],
            fitzpatrick_estimado=raw["fitzpatrick_estimado"],
            scores=raw["scores"],
            confidence_geral=raw["confidence_geral"],
            flags=raw["flags"],
            modelo_versao=self._extractor.model_version,
            duracao_ms=duracao_ms,
        )

    # ── Synchronous pipeline (runs in thread) ─────────────────────────────────

    def _run(self, request: AnalysisRequest) -> dict[str, Any]:
        flags: list[str] = []

        # ── 1. Decode image ───────────────────────────────────────────────────
        try:
            image = Image.open(BytesIO(request.image_bytes)).convert("RGB")
        except Exception as exc:
            logger.warning("Image decode error [scan=%s]: %s", request.scan_id, type(exc).__name__)
            return _build_no_face(request.scan_id, ["ERRO_DECODIFICACAO"])

        # ── 2. Pre-detection quality checks ──────────────────────────────────
        try:
            flags.extend(check_image_quality(image))
        except Exception:
            pass  # quality flags are advisory — never block

        # ── 3. Face detection ─────────────────────────────────────────────────
        detection: FaceDetectionResult = self._detector.detect(image)

        if not detection.face_detected:
            return _build_no_face(request.scan_id, flags + ["FACE_NAO_DETECTADA"])

        if detection.confidence < _FACE_MIN_CONFIDENCE:
            return _build_no_face(
                request.scan_id,
                flags + ["QUALIDADE_BAIXA"],
                confidence=detection.confidence,
            )

        bbox = detection.bbox or {}

        # ── 4. Face coverage check ────────────────────────────────────────────
        try:
            flags.extend(check_image_quality(image, face_bbox=bbox))
        except Exception:
            pass

        # ── 5. Feature extraction across zones ───────────────────────────────
        try:
            scores, confidence = self._extractor.infer_all_zones(detection.zone_crops)
        except Exception as exc:
            logger.error("Feature extraction error [scan=%s]: %s", request.scan_id, exc)
            scores = _NEUTRAL_SCORES.copy()
            confidence = 0.30
            flags.append("INFERENCE_ERROR")

        if confidence < _LOW_CONFIDENCE_THRESHOLD:
            flags.append("LOW_CONFIDENCE")

        # ── 6. Fitzpatrick ────────────────────────────────────────────────────
        fitzpatrick = 3  # default: intermediate
        try:
            cheek = (
                detection.zone_crops.get("left_cheek")
                or detection.zone_crops.get("right_cheek")
            )
            if cheek:
                fitzpatrick = estimate_fitzpatrick(cheek.image)
        except Exception:
            pass  # non-critical

        return {
            "scan_id": request.scan_id,
            "face_detectada": True,
            "face_bbox": bbox,
            "fitzpatrick_estimado": fitzpatrick,
            "scores": scores,
            "confidence_geral": round(confidence, 4),
            "flags": _dedup(flags),
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_no_face(
    scan_id: str,
    flags: list[str],
    confidence: float = 0.0,
) -> dict[str, Any]:
    return {
        "scan_id": scan_id,
        "face_detectada": False,
        "face_bbox": None,
        "fitzpatrick_estimado": 3,
        "scores": _EMPTY_SCORES.copy(),
        "confidence_geral": round(confidence, 4),
        "flags": _dedup(flags),
    }


def _dedup(items: list[str]) -> list[str]:
    """Preserve order, remove duplicates."""
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
