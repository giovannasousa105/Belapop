"""
MediaPipe face detection + FaceMesh landmark extraction.

Uses two MediaPipe pipelines:
  - FaceDetection: fast bounding-box + confidence score
  - FaceMesh: 468-landmark mesh for precise zone segmentation

Both are created once at startup and reused across requests.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import mediapipe as mp
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Zone → FaceMesh landmark index mapping
# Indices for MediaPipe 468-point mesh (with refinement disabled).
# ---------------------------------------------------------------------------

ZONE_LANDMARKS: dict[str, list[int]] = {
    # T-zone / forehead
    "forehead": [10, 9, 8, 151, 108, 69, 54, 21, 162, 389, 251, 284, 332, 297, 338, 300],
    # Nose bridge + tip + nostrils
    "nose": [1, 2, 5, 4, 6, 168, 195, 197, 49, 64, 98, 290, 279, 327, 326, 131, 360],
    # Left cheek (from viewer's perspective)
    "left_cheek": [50, 36, 116, 101, 123, 147, 187, 207, 213, 192, 203, 206, 205, 128, 121],
    # Right cheek
    "right_cheek": [280, 266, 345, 330, 352, 376, 411, 427, 433, 416, 423, 426, 425, 357, 350],
    # Chin / mandible
    "chin": [152, 175, 148, 176, 149, 150, 136, 172, 58, 132, 177, 147, 93, 234, 454, 323],
    # Periorbital left
    "left_eye": [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173],
    # Periorbital right
    "right_eye": [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 386, 385, 384, 398, 388, 387],
}


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------


@dataclass
class ZoneCrop:
    name: str
    image: Image.Image
    x1: int
    y1: int
    x2: int
    y2: int


@dataclass
class FaceDetectionResult:
    face_detected: bool
    confidence: float
    bbox: dict[str, int] | None = None
    landmarks: Any = None          # mediapipe NormalizedLandmarkList
    zone_crops: dict[str, ZoneCrop] = field(default_factory=dict)
    image_size: tuple[int, int] = (0, 0)


# ---------------------------------------------------------------------------
# Detector
# ---------------------------------------------------------------------------


class FaceDetector:
    def __init__(self) -> None:
        # Full-range model covers faces up to 5m away.
        self._face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.3,
        )
        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=False,   # 468 landmarks — no iris (indices > 467)
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        logger.info("FaceDetector initialised (FaceDetection + FaceMesh).")

    def detect(self, image: Image.Image) -> FaceDetectionResult:
        """
        Run face detection + landmark extraction on a PIL Image.

        Returns FaceDetectionResult. Never raises.
        """
        try:
            return self._detect(image)
        except Exception as exc:
            logger.error("FaceDetector.detect unexpected error: %s", exc, exc_info=True)
            return FaceDetectionResult(face_detected=False, confidence=0.0)

    def _detect(self, image: Image.Image) -> FaceDetectionResult:
        rgb = np.array(image.convert("RGB"), dtype=np.uint8)
        h, w = rgb.shape[:2]

        # ── Step 1: confidence via FaceDetection ─────────────────────────────
        det = self._face_detection.process(rgb)
        if not det.detections:
            return FaceDetectionResult(
                face_detected=False,
                confidence=0.0,
                image_size=(w, h),
            )

        confidence = float(det.detections[0].score[0])

        # ── Step 2: 468 landmarks via FaceMesh ───────────────────────────────
        mesh = self._face_mesh.process(rgb)
        if not mesh.multi_face_landmarks:
            # FaceDetection found a face but FaceMesh couldn't resolve mesh —
            # treat as low-quality detection.
            return FaceDetectionResult(
                face_detected=False,
                confidence=confidence,
                image_size=(w, h),
            )

        landmarks = mesh.multi_face_landmarks[0].landmark  # 468 NormalizedLandmark

        # ── Bounding box from landmark extents ───────────────────────────────
        xs = [lm.x * w for lm in landmarks]
        ys = [lm.y * h for lm in landmarks]
        x1 = max(0, int(min(xs)))
        y1 = max(0, int(min(ys)))
        x2 = min(w, int(max(xs)))
        y2 = min(h, int(max(ys)))
        bbox = {"x": x1, "y": y1, "w": max(0, x2 - x1), "h": max(0, y2 - y1)}

        zone_crops = self._extract_zone_crops(image, landmarks, w, h)

        return FaceDetectionResult(
            face_detected=True,
            confidence=confidence,
            bbox=bbox,
            landmarks=landmarks,
            zone_crops=zone_crops,
            image_size=(w, h),
        )

    def _extract_zone_crops(
        self,
        image: Image.Image,
        landmarks: Any,
        width: int,
        height: int,
        padding: int = 14,
    ) -> dict[str, ZoneCrop]:
        """
        Crop rectangular regions around each facial zone from landmark clusters.

        Returns only crops where the bounding box has at least 8×8 pixels.
        """
        n = len(landmarks)
        crops: dict[str, ZoneCrop] = {}

        for zone_name, indices in ZONE_LANDMARKS.items():
            valid = [i for i in indices if i < n]
            if len(valid) < 2:
                continue

            xs = [landmarks[i].x * width for i in valid]
            ys = [landmarks[i].y * height for i in valid]

            x1 = max(0, int(min(xs)) - padding)
            y1 = max(0, int(min(ys)) - padding)
            x2 = min(width, int(max(xs)) + padding)
            y2 = min(height, int(max(ys)) + padding)

            if (x2 - x1) < 8 or (y2 - y1) < 8:
                continue

            crops[zone_name] = ZoneCrop(
                name=zone_name,
                image=image.crop((x1, y1, x2, y2)),
                x1=x1, y1=y1, x2=x2, y2=y2,
            )

        return crops
