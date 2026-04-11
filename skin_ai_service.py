from __future__ import annotations

import base64
import io
import logging
import math
import os
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel
from PIL import Image

router = APIRouter(prefix="/skin-ai", tags=["skin-ai"])

FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
EYE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml")
SMILE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_smile.xml")
SHARED_SECRET = os.getenv("SKIN_AI_SHARED_SECRET", "").strip()
LOGGER = logging.getLogger("belapop.skin_ai")


class QualityGateModel(BaseModel):
    status: str
    brightness_score: float
    sharpness_score: float
    face_coverage_score: float
    centered_face_score: float
    minimal_makeup_score: float
    reasons: List[str]


class LivenessModel(BaseModel):
    blink_detected: bool
    head_movement: bool
    smile_detected: bool
    frown_detected: bool
    depth_score: float
    texture_score: float
    confidence: float
    liveness_score: float


class HeatmapRegionModel(BaseModel):
    condition_type: str
    region_slug: str
    intensity: float
    position_x: float
    position_y: float
    radius: float


class FindingModel(BaseModel):
    finding_type: str
    region_slug: str
    confidence_score: float
    severity_score: float
    position_x: float
    position_y: float
    radius: float
    requires_clinical_review: bool
    metadata: Dict[str, object]


class AnalyzeResponseModel(BaseModel):
    scan_status: str
    quality_gate: QualityGateModel
    liveness: LivenessModel
    scores: Dict[str, float]
    heatmap_regions: List[HeatmapRegionModel]
    findings: List[FindingModel]
    requires_clinical_review: bool
    embedding: List[float]
    embedding_version: str
    heatmap_image_base64: str
    diagnostics: Dict[str, object]


def clamp_unit(value: float) -> float:
    if not math.isfinite(value):
        return 0.0
    return round(max(0.0, min(1.0, float(value))), 6)


def clamp_hundred(value: float) -> float:
    if not math.isfinite(value):
        return 0.0
    return round(max(0.0, min(100.0, float(value))), 2)


def decode_upload(file: UploadFile) -> np.ndarray:
    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=400, detail=f"Arquivo vazio: {file.filename}")
    array = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail=f"Imagem invalida: {file.filename}")
    return image


def detect_face(image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(96, 96))
    if len(faces) == 0:
        return None
    return max(faces, key=lambda face: face[2] * face[3])


def crop_face(image: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
    x, y, w, h = bbox
    return image[y : y + h, x : x + w]


def skin_mask(face: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(face, cv2.COLOR_BGR2YCrCb)

    hsv_mask = cv2.inRange(hsv, np.array([0, 18, 35], dtype=np.uint8), np.array([25, 220, 255], dtype=np.uint8))
    ycrcb_mask = cv2.inRange(
        ycrcb,
        np.array([0, 133, 77], dtype=np.uint8),
        np.array([255, 173, 127], dtype=np.uint8),
    )
    mask = cv2.bitwise_and(hsv_mask, ycrcb_mask)
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    return mask


def masked_mean(channel: np.ndarray, mask: np.ndarray) -> float:
    values = channel[mask > 0]
    return float(values.mean()) if values.size else 0.0


def masked_std(channel: np.ndarray, mask: np.ndarray) -> float:
    values = channel[mask > 0]
    return float(values.std()) if values.size else 0.0


def normalize_stat(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return clamp_unit((value - low) / (high - low))


def centered_face_score(image: np.ndarray, bbox: Optional[Tuple[int, int, int, int]]) -> float:
    if bbox is None:
        return 0.0
    x, y, w, h = bbox
    cx = x + w / 2.0
    cy = y + h / 2.0
    img_h, img_w = image.shape[:2]
    center_x = img_w / 2.0
    center_y = img_h / 2.0
    dx = abs(cx - center_x) / float(img_w or 1)
    dy = abs(cy - center_y) / float(img_h or 1)
    return clamp_unit(1.0 - (dx * 1.4 + dy * 1.25))


def minimal_makeup_score(face: np.ndarray) -> float:
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    height, width = hsv.shape[:2]
    eye_band = hsv[int(height * 0.16) : int(height * 0.42), int(width * 0.12) : int(width * 0.88)]
    lip_band = hsv[int(height * 0.60) : int(height * 0.82), int(width * 0.22) : int(width * 0.78)]
    if eye_band.size == 0 or lip_band.size == 0:
        return 0.55
    eye_saturation = float(eye_band[:, :, 1].mean()) / 255.0
    lip_saturation = float(lip_band[:, :, 1].mean()) / 255.0
    cosmetic_signal = max(eye_saturation * 0.55 + lip_saturation * 0.45 - 0.22, 0.0)
    return clamp_unit(1.0 - cosmetic_signal)


def quality_gate(image: np.ndarray, face_bbox: Optional[Tuple[int, int, int, int]], neutral_face: Optional[np.ndarray] = None) -> QualityGateModel:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(gray.mean()) / 255.0
    sharpness = clamp_unit(cv2.Laplacian(gray, cv2.CV_64F).var() / 420.0)
    reasons: List[str] = []

    if face_bbox is None:
        return QualityGateModel(
            status="rejected",
            brightness_score=clamp_unit(brightness),
            sharpness_score=sharpness,
            face_coverage_score=0.0,
            centered_face_score=0.0,
            minimal_makeup_score=0.0,
            reasons=["Nenhum rosto detectado."],
        )

    _, _, w, h = face_bbox
    coverage = clamp_unit(((w * h) / float(image.shape[0] * image.shape[1])) * 3.8)
    centered = centered_face_score(image, face_bbox)
    makeup = minimal_makeup_score(neutral_face if neutral_face is not None else crop_face(image, face_bbox))

    if brightness < 0.28:
        reasons.append("Iluminacao insuficiente.")
    if brightness > 0.9:
        reasons.append("Excesso de luz frontal.")
    if sharpness < 0.18:
        reasons.append("Imagem sem foco suficiente.")
    if coverage < 0.35:
        reasons.append("Rosto muito distante do enquadramento.")
    if centered < 0.68:
        reasons.append("Rosto fora do centro ideal.")
    if makeup < 0.48:
        reasons.append("Maquiagem intensa dificulta a leitura da pele.")

    return QualityGateModel(
        status="validated" if not reasons else "rejected",
        brightness_score=clamp_unit(brightness),
        sharpness_score=sharpness,
        face_coverage_score=coverage,
        centered_face_score=centered,
        minimal_makeup_score=makeup,
        reasons=reasons,
    )


def eye_band_energy(face: np.ndarray) -> float:
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    band = gray[int(height * 0.18) : int(height * 0.45), int(width * 0.14) : int(width * 0.86)]
    if band.size == 0:
        return 0.0
    return float(cv2.Laplacian(band, cv2.CV_64F).var())


def detect_blink(neutral_face: np.ndarray, blink_face: np.ndarray) -> bool:
    gray_neutral = cv2.cvtColor(neutral_face, cv2.COLOR_BGR2GRAY)
    gray_blink = cv2.cvtColor(blink_face, cv2.COLOR_BGR2GRAY)
    eyes_neutral = EYE_CASCADE.detectMultiScale(gray_neutral, 1.1, 4, minSize=(18, 18))
    eyes_blink = EYE_CASCADE.detectMultiScale(gray_blink, 1.1, 4, minSize=(18, 18))
    if len(eyes_neutral) >= 1 and len(eyes_blink) == 0:
        return True

    neutral_energy = eye_band_energy(neutral_face)
    blink_energy = eye_band_energy(blink_face)
    if neutral_energy <= 0:
        return False
    return (blink_energy / neutral_energy) < 0.78


def detect_head_movement(
    neutral_bbox: Optional[Tuple[int, int, int, int]],
    turn_bbox: Optional[Tuple[int, int, int, int]],
    width: int,
) -> bool:
    if neutral_bbox is None or turn_bbox is None or width <= 0:
        return False
    nx = neutral_bbox[0] + neutral_bbox[2] / 2
    tx = turn_bbox[0] + turn_bbox[2] / 2
    return abs(tx - nx) / width > 0.05


def detect_smile(neutral_face: np.ndarray, smile_face: np.ndarray) -> bool:
    gray_smile = cv2.cvtColor(smile_face, cv2.COLOR_BGR2GRAY)
    lower = gray_smile[int(gray_smile.shape[0] * 0.45) :, :]
    smiles = SMILE_CASCADE.detectMultiScale(lower, scaleFactor=1.7, minNeighbors=22, minSize=(30, 18))
    if len(smiles) > 0:
        return True

    def mouth_curve_energy(face: np.ndarray) -> float:
        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        mouth = gray[int(gray.shape[0] * 0.60) : int(gray.shape[0] * 0.86), int(gray.shape[1] * 0.20) : int(gray.shape[1] * 0.80)]
        if mouth.size == 0:
            return 0.0
        edges = cv2.Canny(mouth, 50, 150)
        return float(edges.mean())

    return mouth_curve_energy(smile_face) > mouth_curve_energy(neutral_face) * 1.18


def detect_frown(neutral_face: np.ndarray, frown_face: np.ndarray) -> bool:
    def brow_texture(face: np.ndarray) -> float:
        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        brow = gray[int(gray.shape[0] * 0.12) : int(gray.shape[0] * 0.34), int(gray.shape[1] * 0.22) : int(gray.shape[1] * 0.78)]
        if brow.size == 0:
            return 0.0
        lap = np.abs(cv2.Laplacian(brow, cv2.CV_64F))
        return float(lap.mean())

    neutral_texture = brow_texture(neutral_face)
    frown_texture = brow_texture(frown_face)
    if neutral_texture <= 0:
        return False
    return (frown_texture / neutral_texture) > 1.12


def compute_depth_score(face: np.ndarray, mask: np.ndarray) -> float:
    if face.size == 0:
        return 0.0
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    v_channel = hsv[:, :, 2]
    center = v_channel[int(v_channel.shape[0] * 0.2) : int(v_channel.shape[0] * 0.8), int(v_channel.shape[1] * 0.2) : int(v_channel.shape[1] * 0.8)]
    outer = v_channel.copy()
    outer[int(v_channel.shape[0] * 0.2) : int(v_channel.shape[0] * 0.8), int(v_channel.shape[1] * 0.2) : int(v_channel.shape[1] * 0.8)] = 0
    center_mean = float(center.mean()) if center.size else 0.0
    outer_mean = float(outer[outer > 0].mean()) if np.any(outer > 0) else 0.0
    mask_ratio = float(np.count_nonzero(mask)) / float(mask.size or 1)
    return clamp_unit(0.55 * normalize_stat(center_mean - outer_mean, -12, 26) + 0.45 * mask_ratio)


def compute_scores(face: np.ndarray, mask: np.ndarray) -> Dict[str, float]:
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(face, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    lap = np.abs(cv2.Laplacian(gray, cv2.CV_64F))

    brightness = masked_mean(hsv[:, :, 2], mask)
    redness_base = masked_mean(lab[:, :, 1], mask)
    pigmentation_var = masked_std(lab[:, :, 0], mask)
    texture = float(lap[mask > 0].mean()) if np.any(mask > 0) else 0.0

    acne_mask = (
        (lab[:, :, 1] > 150)
        & (hsv[:, :, 1] > 68)
        & (hsv[:, :, 2] > 55)
        & (mask > 0)
    )
    acne_score = clamp_hundred((float(np.count_nonzero(acne_mask)) / float(np.count_nonzero(mask) or 1)) * 1800.0)
    redness_score = clamp_hundred(normalize_stat(redness_base, 132, 168) * 100.0)
    pigmentation_score = clamp_hundred(normalize_stat(pigmentation_var, 8, 28) * 100.0)
    pore_visibility = clamp_hundred(normalize_stat(texture, 6, 32) * 100.0)
    wrinkle_depth = clamp_hundred(normalize_stat(float(np.percentile(lap[mask > 0], 92)) if np.any(mask > 0) else 0.0, 8, 42) * 100.0)
    hydration_score = clamp_hundred((normalize_stat(brightness, 92, 178) * 0.55 + (1.0 - normalize_stat(texture, 6, 32)) * 0.45) * 100.0)
    elasticity_score = clamp_hundred(
        100.0
        - wrinkle_depth * 0.48
        - pore_visibility * 0.24
        - pigmentation_score * 0.14
        - redness_score * 0.14
    )

    return {
        "hydration_score": hydration_score,
        "acne_score": acne_score,
        "pigmentation_score": pigmentation_score,
        "redness_score": redness_score,
        "elasticity_score": elasticity_score,
        "pore_visibility": pore_visibility,
        "wrinkle_depth": wrinkle_depth,
    }


def region_metrics(face: np.ndarray, mask: np.ndarray, scores: Dict[str, float]) -> List[HeatmapRegionModel]:
    regions: List[HeatmapRegionModel] = []

    def add(condition_type: str, region_slug: str, intensity: float, x: float, y: float, radius: float) -> None:
        if intensity < 12:
            return
        regions.append(
            HeatmapRegionModel(
                condition_type=condition_type,
                region_slug=region_slug,
                intensity=clamp_hundred(intensity),
                position_x=clamp_unit(x),
                position_y=clamp_unit(y),
                radius=clamp_unit(radius),
            )
        )

    add("acne", "chin", scores["acne_score"], 0.52, 0.76, 0.12)
    add("acne", "forehead", scores["acne_score"] * 0.78, 0.50, 0.20, 0.12)
    add("pigmentation", "right_cheek", scores["pigmentation_score"], 0.68, 0.50, 0.12)
    add("pigmentation", "left_cheek", scores["pigmentation_score"] * 0.94, 0.32, 0.50, 0.12)
    add("redness", "nose", scores["redness_score"], 0.50, 0.47, 0.08)
    add("pores", "t_zone", scores["pore_visibility"], 0.50, 0.35, 0.14)
    add("wrinkles", "eye_area", scores["wrinkle_depth"], 0.64, 0.36, 0.09)
    add("hydration", "cheeks", 100.0 - scores["hydration_score"], 0.34, 0.58, 0.13)
    add("hydration", "jawline", (100.0 - scores["hydration_score"]) * 0.88, 0.66, 0.70, 0.12)
    return regions


def region_from_position(x: float, y: float) -> str:
    if y < 0.28:
        return "forehead"
    if 0.42 <= y <= 0.62 and x < 0.42:
        return "left_cheek"
    if 0.42 <= y <= 0.62 and x > 0.58:
        return "right_cheek"
    if 0.38 <= x <= 0.62 and 0.38 <= y <= 0.6:
        return "nose"
    if y > 0.68:
        return "chin"
    return "jawline"


def contour_circularity(contour: np.ndarray) -> float:
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True) or 1.0
    return float((4 * math.pi * area) / (perimeter * perimeter)) if area > 0 else 0.0


def detect_findings(face: np.ndarray, mask: np.ndarray) -> List[FindingModel]:
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(face, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    lap = np.abs(cv2.Laplacian(gray, cv2.CV_64F))

    dark_mask = ((gray < 84) & (mask > 0)).astype(np.uint8) * 255
    red_mask = ((lab[:, :, 1] > 154) & (hsv[:, :, 1] > 80) & (mask > 0)).astype(np.uint8) * 255
    ker_mask = ((lab[:, :, 2] > 148) & (gray > 78) & (lap > 8) & (mask > 0)).astype(np.uint8) * 255
    scc_mask = ((lap > 11) & (gray > 95) & (lab[:, :, 1] > 140) & (mask > 0)).astype(np.uint8) * 255

    findings: List[FindingModel] = []

    def collect(binary: np.ndarray, kind: str) -> None:
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        face_h, face_w = face.shape[:2]
        for contour in contours[:18]:
            area = cv2.contourArea(contour)
            if area < 32:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            area_ratio = area / float(face_h * face_w or 1)
            if area_ratio > 0.08:
                continue
            cx = (x + w / 2.0) / float(face_w or 1)
            cy = (y + h / 2.0) / float(face_h or 1)
            radius = max(w, h) / float(max(face_w, face_h, 1))
            circularity = contour_circularity(contour)
            roi_mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.drawContours(roi_mask, [contour], -1, 255, thickness=-1)
            color_var = float(np.std(lab[:, :, 1][roi_mask > 0])) if np.any(roi_mask > 0) else 0.0
            texture = float(lap[roi_mask > 0].mean()) if np.any(roi_mask > 0) else 0.0

            finding_type = kind
            review = False
            confidence = 0.58
            severity = 26.0

            if kind == "dark":
                if circularity < 0.42 or color_var > 18 or area_ratio > 0.012:
                    finding_type = "melanoma_triage"
                    review = True
                    confidence = 0.76
                    severity = 78.0
                else:
                    finding_type = "nevus_melanocytic"
                    confidence = 0.66
                    severity = 36.0
            elif kind == "red":
                if circularity > 0.6 and area_ratio < 0.01:
                    finding_type = "cherry_angioma"
                    confidence = 0.68
                    severity = 28.0
                else:
                    finding_type = "scc_triage"
                    review = True
                    confidence = 0.72
                    severity = 74.0
            elif kind == "ker":
                finding_type = "keratosis"
                confidence = 0.6
                severity = 42.0
                if texture > 16 and circularity < 0.48:
                    finding_type = "scc_triage"
                    review = True
                    confidence = 0.74
                    severity = 76.0
            elif kind == "scc":
                finding_type = "scc_triage"
                review = True
                confidence = 0.75
                severity = 79.0

            findings.append(
                FindingModel(
                    finding_type=finding_type,
                    region_slug=region_from_position(cx, cy),
                    confidence_score=clamp_unit(confidence),
                    severity_score=clamp_hundred(severity),
                    position_x=clamp_unit(cx),
                    position_y=clamp_unit(cy),
                    radius=clamp_unit(max(radius, 0.04)),
                    requires_clinical_review=review,
                    metadata={
                        "area_ratio": round(area_ratio, 6),
                        "circularity": round(circularity, 4),
                        "color_variance": round(color_var, 4),
                        "texture": round(texture, 4),
                        "triage_only": True,
                    },
                )
            )

    collect(dark_mask, "dark")
    collect(red_mask, "red")
    collect(ker_mask, "ker")
    collect(scc_mask, "scc")

    deduped: List[FindingModel] = []
    for finding in sorted(findings, key=lambda item: (item.requires_clinical_review, item.severity_score, item.confidence_score), reverse=True):
        duplicate = False
        for existing in deduped:
            distance = math.sqrt(
                (finding.position_x - existing.position_x) ** 2
                + (finding.position_y - existing.position_y) ** 2
            )
            if distance < 0.08 and finding.finding_type == existing.finding_type:
                duplicate = True
                break
        if not duplicate:
            deduped.append(finding)
        if len(deduped) >= 8:
            break

    return deduped


def render_heatmap(image: np.ndarray, bbox: Tuple[int, int, int, int], regions: List[HeatmapRegionModel]) -> str:
    overlay = image.copy()
    color_map = {
        "acne": (69, 34, 230),
        "hydration": (80, 196, 255),
        "pigmentation": (0, 140, 255),
        "pores": (208, 90, 140),
        "wrinkles": (255, 132, 70),
        "redness": (30, 60, 230),
    }

    x, y, w, h = bbox
    for region in regions:
        center = (x + int(region.position_x * w), y + int(region.position_y * h))
        radius = max(18, int(region.radius * min(w, h)))
        color = color_map.get(region.condition_type, (180, 80, 220))
        intensity = clamp_unit(region.intensity / 100.0)
        cv2.circle(overlay, center, radius, color, thickness=-1)
        cv2.circle(overlay, center, max(8, radius // 2), tuple(min(255, channel + 20) for channel in color), thickness=-1)
        overlay = cv2.addWeighted(overlay, 0.65 + intensity * 0.1, image, 0.35 - intensity * 0.1, 0)

    success, buffer = cv2.imencode(".png", overlay)
    if not success:
        raise HTTPException(status_code=500, detail="Falha ao gerar heatmap.")
    return base64.b64encode(buffer.tobytes()).decode("utf-8")


def build_embedding(face: np.ndarray, scores: Dict[str, float]) -> List[float]:
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    gray_small = cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA).astype(np.float32).flatten() / 255.0

    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    h_hist = cv2.calcHist([hsv], [0], None, [16], [0, 180]).flatten()
    s_hist = cv2.calcHist([hsv], [1], None, [16], [0, 256]).flatten()
    edges = cv2.Canny(gray, 60, 140)
    e_hist = cv2.calcHist([edges], [0], None, [16], [0, 256]).flatten()

    def norm_hist(values: np.ndarray) -> List[float]:
        total = float(values.sum()) or 1.0
        return [float(v / total) for v in values]

    summary = [
        scores["hydration_score"] / 100.0,
        scores["elasticity_score"] / 100.0,
        scores["pigmentation_score"] / 100.0,
        scores["acne_score"] / 100.0,
        scores["redness_score"] / 100.0,
        scores["pore_visibility"] / 100.0,
        scores["wrinkle_depth"] / 100.0,
        float(gray.mean()) / 255.0,
    ]

    grid = cv2.resize(gray, (4, 2), interpolation=cv2.INTER_AREA).astype(np.float32).flatten() / 255.0

    vector = np.concatenate(
        [
            gray_small,
            np.array(norm_hist(h_hist), dtype=np.float32),
            np.array(norm_hist(s_hist), dtype=np.float32),
            np.array(norm_hist(e_hist), dtype=np.float32),
            np.array(summary, dtype=np.float32),
            np.array(grid, dtype=np.float32),
        ]
    )
    norm = float(np.linalg.norm(vector)) or 1.0
    normalized = vector / norm
    return [round(float(value), 6) for value in normalized.tolist()]


def default_rejected_payload(reason: str) -> AnalyzeResponseModel:
    blank_regions: List[HeatmapRegionModel] = []
    base_scores = {
        "hydration_score": 50.0,
        "acne_score": 50.0,
        "pigmentation_score": 50.0,
        "redness_score": 50.0,
        "elasticity_score": 50.0,
        "pore_visibility": 50.0,
        "wrinkle_depth": 50.0,
    }
    blank = np.zeros((320, 240, 3), dtype=np.uint8)
    img = Image.fromarray(blank)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return AnalyzeResponseModel(
        scan_status="rejected",
        quality_gate=QualityGateModel(
            status="rejected",
            brightness_score=0.0,
            sharpness_score=0.0,
            face_coverage_score=0.0,
            centered_face_score=0.0,
            minimal_makeup_score=0.0,
            reasons=[reason],
        ),
        liveness=LivenessModel(
            blink_detected=False,
            head_movement=False,
            smile_detected=False,
            frown_detected=False,
            depth_score=0.0,
            texture_score=0.0,
            confidence=0.0,
            liveness_score=0.0,
        ),
        scores=base_scores,
        heatmap_regions=blank_regions,
        findings=[],
        requires_clinical_review=False,
        embedding=[0.0] * 128,
        embedding_version="vision_v2",
        heatmap_image_base64=base64.b64encode(buffer.getvalue()).decode("utf-8"),
        diagnostics={"reason": reason},
    )


@router.post("/analyze", response_model=AnalyzeResponseModel)
async def analyze_skin_scan(
    neutral_frame: UploadFile = File(...),
    blink_frame: UploadFile = File(...),
    smile_frame: UploadFile = File(...),
    frown_frame: UploadFile = File(...),
    turn_frame: UploadFile = File(...),
    user_id: Optional[str] = Form(default=None),
    capture_mode: Optional[str] = Form(default=None),
    x_skin_ai_secret: Optional[str] = Header(default=None),
) -> AnalyzeResponseModel:
    if SHARED_SECRET and x_skin_ai_secret != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Nao autorizado para Skin AI Service.")
    try:
        neutral = decode_upload(neutral_frame)
        blink = decode_upload(blink_frame)
        smile = decode_upload(smile_frame)
        frown = decode_upload(frown_frame)
        turn = decode_upload(turn_frame)

        neutral_bbox = detect_face(neutral)
        blink_bbox = detect_face(blink)
        smile_bbox = detect_face(smile)
        frown_bbox = detect_face(frown)
        turn_bbox = detect_face(turn)

        if neutral_bbox is None:
            return default_rejected_payload("Nenhum rosto detectado.")

        neutral_face = crop_face(neutral, neutral_bbox)
        blink_face = crop_face(blink, blink_bbox if blink_bbox is not None else neutral_bbox)
        smile_face = crop_face(smile, smile_bbox if smile_bbox is not None else neutral_bbox)
        frown_face = crop_face(frown, frown_bbox if frown_bbox is not None else neutral_bbox)
        turn_face = crop_face(turn, turn_bbox if turn_bbox is not None else neutral_bbox)
        mask = skin_mask(neutral_face)
        gate = quality_gate(neutral, neutral_bbox, neutral_face)

        blink_detected = detect_blink(neutral_face, blink_face)
        smile_detected = detect_smile(neutral_face, smile_face)
        frown_detected = detect_frown(neutral_face, frown_face)
        head_movement = detect_head_movement(neutral_bbox, turn_bbox, neutral.shape[1])
        depth_score = compute_depth_score(neutral_face, mask)
        texture_score = gate.sharpness_score

        liveness_confidence = clamp_unit(
            gate.face_coverage_score * 0.16
            + gate.centered_face_score * 0.12
            + gate.minimal_makeup_score * 0.12
            + gate.sharpness_score * 0.14
            + depth_score * 0.18
            + (0.10 if blink_detected else 0.0)
            + (0.08 if head_movement else 0.0)
            + (0.05 if smile_detected else 0.0)
            + (0.05 if frown_detected else 0.0)
        )

        liveness = LivenessModel(
            blink_detected=blink_detected,
            head_movement=head_movement,
            smile_detected=smile_detected,
            frown_detected=frown_detected,
            depth_score=depth_score,
            texture_score=texture_score,
            confidence=liveness_confidence,
            liveness_score=liveness_confidence,
        )

        scores = compute_scores(neutral_face, mask)
        regions = region_metrics(neutral_face, mask, scores)
        findings = detect_findings(neutral_face, mask)
        heatmap = render_heatmap(neutral, neutral_bbox, regions)
        embedding = build_embedding(neutral_face, scores)

        reasons = list(gate.reasons)
        if not blink_detected:
            reasons.append("Piscada nao detectada.")
        if not smile_detected:
            reasons.append("Sorriso leve nao detectado.")
        if not frown_detected:
            reasons.append("Expressao de testa franzida nao detectada.")
        if not head_movement:
            reasons.append("Movimento de cabeca insuficiente.")
        if liveness_confidence < 0.55:
            reasons.append("Liveness insuficiente.")

        status = "validated" if not reasons else "rejected"
        quality = QualityGateModel(
            status="validated" if not reasons else "rejected",
            brightness_score=gate.brightness_score,
            sharpness_score=gate.sharpness_score,
            face_coverage_score=gate.face_coverage_score,
            centered_face_score=gate.centered_face_score,
            minimal_makeup_score=gate.minimal_makeup_score,
            reasons=reasons,
        )

        return AnalyzeResponseModel(
            scan_status=status,
            quality_gate=quality,
            liveness=liveness,
            scores=scores,
            heatmap_regions=regions,
            findings=findings,
            requires_clinical_review=any(item.requires_clinical_review for item in findings),
            embedding=embedding,
            embedding_version="vision_v2",
            heatmap_image_base64=heatmap,
            diagnostics={
                "user_id": user_id,
                "capture_mode": capture_mode,
                "face_bbox": [int(value) for value in neutral_bbox],
                "neutral_shape": [int(value) for value in neutral.shape],
                "blink_face_detected": blink_bbox is not None,
                "smile_face_detected": smile_bbox is not None,
                "frown_face_detected": frown_bbox is not None,
                "turn_face_detected": turn_bbox is not None,
                "mask_coverage": round(float(np.count_nonzero(mask)) / float(mask.size or 1), 6),
                "findings_count": len(findings),
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        LOGGER.exception("Skin AI analyze failed")
        raise HTTPException(status_code=500, detail=f"analysis_failed:{type(exc).__name__}:{exc}") from exc
