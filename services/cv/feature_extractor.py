"""
Skin feature extraction via ONNX inference with heuristic fallback.

Model contract:
  Input  : float32 NCHW tensor, shape (1, 3, 224, 224), ImageNet-normalised
  Output : float32 tensor whose first 7 values map to the 7 skin scores
           (sigmoid applied here — model may output raw logits)

If the .onnx file is absent or fails to load, a pixel-statistic heuristic
is used instead. Heuristic confidence is capped at 0.40 so the clinical
layer always knows to treat those scores as approximate.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np
from PIL import Image

if TYPE_CHECKING:
    from face_detector import ZoneCrop

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCORE_NAMES: list[str] = [
    "acne", "poros", "textura", "oleosidade",
    "pigmentacao", "vermelhidao", "ressecamento",
]

_IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Per-zone per-score weight multipliers for aggregation.
# Zones not listed default to 1.0 for all scores.
_ZONE_WEIGHTS: dict[str, dict[str, float]] = {
    "forehead":    {"oleosidade": 1.5, "acne": 1.2, "poros": 1.2},
    "nose":        {"oleosidade": 1.5, "poros": 1.3},
    "left_cheek":  {"vermelhidao": 1.2, "pigmentacao": 1.2},
    "right_cheek": {"vermelhidao": 1.2, "pigmentacao": 1.2},
    "chin":        {"acne": 1.2},
    "left_eye":    {"ressecamento": 1.1},
    "right_eye":   {"ressecamento": 1.1},
}


# ---------------------------------------------------------------------------
# Feature extractor
# ---------------------------------------------------------------------------


class FeatureExtractor:
    def __init__(self, model_path: Path | None = None) -> None:
        self._session = None
        self._input_name: str = ""
        self._model_version: str = "heuristic-1.0"

        if model_path and model_path.exists():
            self._load_onnx(model_path)
        else:
            logger.warning(
                "ONNX model not found at %s — using heuristic fallback. "
                "Set MODEL_PATH env var to point to a valid .onnx file.",
                model_path,
            )

    # ── Public ───────────────────────────────────────────────────────────────

    @property
    def model_version(self) -> str:
        return self._model_version

    def infer_all_zones(
        self,
        zone_crops: dict[str, "ZoneCrop"],
    ) -> tuple[dict[str, float], float]:
        """
        Run inference on every zone crop and aggregate with zone-aware weights.

        Returns:
            (scores, confidence_geral) where scores is a dict of 7 floats in [0,1].
        """
        if not zone_crops:
            return {name: 0.5 for name in SCORE_NAMES}, 0.35

        per_zone: dict[str, tuple[dict[str, float], float]] = {}
        for zone_name, crop in zone_crops.items():
            zone_scores, zone_conf = self._infer_one(crop.image)
            per_zone[zone_name] = (zone_scores, zone_conf)

        # Weighted aggregation
        aggregated: dict[str, float] = {}
        for score_name in SCORE_NAMES:
            total_w = 0.0
            total_v = 0.0
            for zone_name, (z_scores, _) in per_zone.items():
                w = _ZONE_WEIGHTS.get(zone_name, {}).get(score_name, 1.0)
                total_v += z_scores.get(score_name, 0.5) * w
                total_w += w
            raw = total_v / total_w if total_w > 0 else 0.5
            aggregated[score_name] = round(max(0.0, min(1.0, raw)), 4)

        confidence = sum(c for _, c in per_zone.values()) / len(per_zone)
        return aggregated, round(float(confidence), 4)

    # ── ONNX ─────────────────────────────────────────────────────────────────

    def _load_onnx(self, model_path: Path) -> None:
        try:
            import onnxruntime as ort  # optional heavy dep — only import when used

            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
            self._session = ort.InferenceSession(str(model_path), providers=providers)
            self._input_name = self._session.get_inputs()[0].name
            self._model_version = f"{model_path.stem}-onnx"
            logger.info(
                "ONNX model loaded: %s — provider=%s",
                model_path.name,
                self._session.get_providers()[0],
            )
        except Exception as exc:
            logger.error("Failed to load ONNX model (%s): %s — falling back to heuristic", model_path, exc)
            self._session = None

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        """Resize to 224×224, normalise with ImageNet stats → float32 NCHW."""
        img = image.convert("RGB").resize((224, 224), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = (arr - _IMAGENET_MEAN) / _IMAGENET_STD
        return arr.transpose(2, 0, 1)[np.newaxis].astype(np.float32)  # (1,3,224,224)

    def _onnx_infer(self, image: Image.Image) -> tuple[dict[str, float], float]:
        try:
            tensor = self._preprocess(image)
            outputs = self._session.run(None, {self._input_name: tensor})  # type: ignore[union-attr]
            raw = np.array(outputs[0]).flatten()

            # Take first 7 values; pad with neutral 0 if model has fewer outputs
            logits = np.pad(raw[:7], (0, max(0, 7 - len(raw[:7]))), constant_values=0.0)
            scores_arr = 1.0 / (1.0 + np.exp(-logits.astype(np.float64)))  # sigmoid

            scores = {name: round(float(scores_arr[i]), 4) for i, name in enumerate(SCORE_NAMES)}

            # Confidence: mean distance from decision boundary (0.5)
            confidence = float(np.mean(np.abs(scores_arr - 0.5) * 2.0))
            return scores, round(confidence, 4)

        except Exception as exc:
            logger.error("ONNX inference failed: %s — falling back to heuristic", exc)
            return self._heuristic_infer(image)

    def _infer_one(self, image: Image.Image) -> tuple[dict[str, float], float]:
        if self._session is not None:
            return self._onnx_infer(image)
        return self._heuristic_infer(image)

    # ── Heuristic fallback ────────────────────────────────────────────────────

    def _heuristic_infer(self, image: Image.Image) -> tuple[dict[str, float], float]:
        """
        Derive plausible skin scores from basic pixel statistics.

        Used when no ONNX model is available (development / CI).
        Confidence is fixed at 0.40 to signal non-ML output.
        """
        try:
            rgb = np.array(image.convert("RGB"), dtype=np.float32) / 255.0
            if rgb.size == 0:
                raise ValueError("empty image array")

            gray = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]

            # ── texture / poros ──────────────────────────────────────────────
            std_gray = float(np.std(gray))
            dx = np.diff(gray, axis=1, prepend=gray[:, :1])
            dy = np.diff(gray, axis=0, prepend=gray[:1, :])
            edge_mag = float(np.mean(np.sqrt(dx ** 2 + dy ** 2)))

            # ── oleosidade — specular highlights ─────────────────────────────
            highlights = float(np.mean(gray > 0.85))

            # ── vermelhidao — red channel excess ─────────────────────────────
            r_excess = float(np.mean(np.clip(rgb[..., 0] - rgb[..., 1], 0.0, 1.0)))

            # ── pigmentacao — colour heterogeneity ───────────────────────────
            pigm = float(np.std(rgb[..., 1]))  # green channel variation

            # ── ressecamento — low saturation ─────────────────────────────────
            cmax = rgb.max(axis=-1)
            cmin = rgb.min(axis=-1)
            saturation = np.where(cmax > 0, (cmax - cmin) / (cmax + 1e-6), 0.0)
            ressec = float(np.mean(1.0 - saturation))

            # ── acne — dark isolated spots ────────────────────────────────────
            dark_fraction = float(np.mean(gray < 0.25))

            scores = {
                "acne":        round(min(1.0, dark_fraction * 4.0), 4),
                "poros":       round(min(1.0, edge_mag * 6.0), 4),
                "textura":     round(min(1.0, std_gray * 4.0), 4),
                "oleosidade":  round(min(1.0, highlights * 6.0), 4),
                "pigmentacao": round(min(1.0, pigm * 5.0), 4),
                "vermelhidao": round(min(1.0, r_excess * 5.0), 4),
                "ressecamento": round(min(1.0, max(0.0, ressec - 0.5) * 2.0), 4),
            }
            return scores, 0.40

        except Exception as exc:
            logger.warning("Heuristic inference failed: %s", exc)
            return {name: 0.5 for name in SCORE_NAMES}, 0.30
