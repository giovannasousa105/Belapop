"""
Pre-inference image quality checks.

Flags produced here are advisory — they are included in the response
but never block analysis. The clinical scoring layer uses them to
calibrate confidence.
"""
from __future__ import annotations

import numpy as np
from PIL import Image

FLAG_ILUMINACAO_RUIM = "ILUMINACAO_RUIM"
FLAG_IMAGEM_BORRADA = "IMAGEM_BORRADA"
FLAG_ROSTO_LONGE = "ROSTO_LONGE"

_BRIGHTNESS_LOW = 40.0
_BRIGHTNESS_HIGH = 215.0
_LAPLACIAN_VAR_MIN = 100.0
_FACE_MIN_COVERAGE = 0.20


def check_image_quality(
    image: Image.Image,
    face_bbox: dict[str, int] | None = None,
) -> list[str]:
    """
    Evaluate image quality and return a list of advisory flags.

    Args:
        image: PIL Image (any mode — converted internally).
        face_bbox: Optional dict with keys x, y, w, h (pixel coordinates).
                   Required for ROSTO_LONGE check.

    Returns:
        List of flag strings (may be empty).
    """
    flags: list[str] = []

    try:
        gray = _to_gray_float(image)
    except Exception:
        return flags  # can't evaluate quality without a valid array

    # ── Brightness ────────────────────────────────────────────────────────────
    brightness = float(np.mean(gray))
    if brightness < _BRIGHTNESS_LOW or brightness > _BRIGHTNESS_HIGH:
        flags.append(FLAG_ILUMINACAO_RUIM)

    # ── Blur (Laplacian variance) ─────────────────────────────────────────────
    lap_var = _laplacian_variance(gray)
    if lap_var < _LAPLACIAN_VAR_MIN:
        flags.append(FLAG_IMAGEM_BORRADA)

    # ── Face coverage ─────────────────────────────────────────────────────────
    if face_bbox is not None:
        img_w, img_h = image.size
        total_area = img_w * img_h
        face_area = face_bbox.get("w", 0) * face_bbox.get("h", 0)
        if total_area > 0 and face_area / total_area < _FACE_MIN_COVERAGE:
            flags.append(FLAG_ROSTO_LONGE)

    return flags


# ── Internal helpers ──────────────────────────────────────────────────────────


def _to_gray_float(image: Image.Image) -> np.ndarray:
    """Convert image to float64 grayscale array in [0, 255]."""
    rgb = np.array(image.convert("RGB"), dtype=np.float32)
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def _laplacian_variance(gray: np.ndarray) -> float:
    """
    Estimate blur via variance of the discrete Laplacian.

    Higher variance = sharper image.
    Uses simple finite-difference kernel without boundary wrapping.
    """
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0

    lap = (
        gray[:-2, 1:-1]  # top
        + gray[2:, 1:-1]   # bottom
        + gray[1:-1, :-2]  # left
        + gray[1:-1, 2:]   # right
        - 4.0 * gray[1:-1, 1:-1]
    )
    return float(np.var(lap))
