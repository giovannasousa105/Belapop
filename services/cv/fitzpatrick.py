"""
Fitzpatrick phototype estimation via ITA° (Individual Typology Angle).

Formula: ITA° = arctan((L* − 50) / b*) × (180 / π)

Thresholds (Chardon et al.):
  ITA° > 55   → Type I   (very light)
  41 – 55     → Type II  (light)
  28 – 41     → Type III (intermediate)
  10 – 28     → Type IV  (tan)
  −30 – 10    → Type V   (brown)
  < −30       → Type VI  (dark)
"""
from __future__ import annotations

import numpy as np
from PIL import Image


def _rgb_to_lab(rgb_f32: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Convert float32 RGB array (H×W×3, values in [0,1]) to CIE L* and b*.

    Returns (L_array, b_array), both shape H×W.
    """
    # 1. sRGB linearisation
    mask = rgb_f32 > 0.04045
    linear = np.where(mask, ((rgb_f32 + 0.055) / 1.055) ** 2.4, rgb_f32 / 12.92)

    # 2. Linear RGB → CIE XYZ (D65 illuminant, IEC 61966-2-1)
    M = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ],
        dtype=np.float32,
    )
    xyz = linear @ M.T  # H×W×3

    # 3. XYZ → CIE L*a*b* (D65 reference white)
    D65 = np.array([0.95047, 1.00000, 1.08883], dtype=np.float32)
    xyz_n = xyz / D65

    eps = 0.008856
    kappa = 903.3

    def _f(t: np.ndarray) -> np.ndarray:
        return np.where(t > eps, np.cbrt(t), (kappa * t + 16.0) / 116.0)

    fx = _f(xyz_n[..., 0])
    fy = _f(xyz_n[..., 1])
    fz = _f(xyz_n[..., 2])

    L_star = 116.0 * fy - 16.0
    b_star = 200.0 * (fy - fz)

    return L_star, b_star


def estimate_fitzpatrick(cheek_crop: Image.Image) -> int:
    """
    Estimate Fitzpatrick phototype (1–6) from a cheek-region crop.

    Falls back to 3 (intermediate) on any error.
    """
    if cheek_crop is None or cheek_crop.width < 4 or cheek_crop.height < 4:
        return 3

    try:
        rgb = np.array(cheek_crop.convert("RGB"), dtype=np.float32) / 255.0
        L, b_star = _rgb_to_lab(rgb)

        L_med = float(np.median(L))
        b_med = float(np.median(b_star))

        # Guard against near-zero b* to avoid arctan instability
        if abs(b_med) < 1e-4:
            b_med = 1e-4

        ita = float(np.degrees(np.arctan2(L_med - 50.0, b_med)))
    except Exception:
        return 3

    if ita > 55:
        return 1
    if ita > 41:
        return 2
    if ita > 28:
        return 3
    if ita > 10:
        return 4
    if ita > -30:
        return 5
    return 6
