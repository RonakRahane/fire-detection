# Computer vision helper utilities for frame analysis and diagnostics.
# Implements bounding box clamping, HSV flame color verification, and camera feed quality monitoring.

import time

import cv2
import numpy as np

last_frame_hash = None
same_frame_count = 0
last_frame_received_at = 0.0


def clamp_box(box, width, height):
    x1, y1, x2, y2 = box
    return [
        int(max(0, min(width - 1, x1))),
        int(max(0, min(height - 1, y1))),
        int(max(0, min(width - 1, x2))),
        int(max(0, min(height - 1, y2))),
    ]


def fire_visual_signature(image_np, box):
    height, width = image_np.shape[:2]
    x1, y1, x2, y2 = clamp_box(box, width, height)

    if x2 <= x1 or y2 <= y1:
        return False, {
            "hot_ratio": 0,
            "body_ratio": 0,
            "red_ratio": 0,
            "brightness_std": 0,
            "area_ratio": 0,
        }

    roi = image_np[y1:y2, x1:x2]
    hsv_roi = cv2.cvtColor(roi, cv2.COLOR_RGB2HSV)
    gray_roi = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)

    hot_mask = cv2.inRange(
        hsv_roi,
        np.array([10, 25, 235], dtype="uint8"),
        np.array([50, 210, 255], dtype="uint8"),
    )
    body_mask = cv2.inRange(
        hsv_roi,
        np.array([8, 90, 145], dtype="uint8"),
        np.array([45, 255, 255], dtype="uint8"),
    )
    red_mask_1 = cv2.inRange(
        hsv_roi,
        np.array([0, 70, 70], dtype="uint8"),
        np.array([7, 255, 255], dtype="uint8"),
    )
    red_mask_2 = cv2.inRange(
        hsv_roi,
        np.array([160, 70, 70], dtype="uint8"),
        np.array([180, 255, 255], dtype="uint8"),
    )

    pixel_count = max(1, roi.shape[0] * roi.shape[1])
    hot_ratio = cv2.countNonZero(hot_mask) / pixel_count
    body_ratio = cv2.countNonZero(body_mask) / pixel_count
    red_ratio = cv2.countNonZero(red_mask_1 | red_mask_2) / pixel_count
    brightness_std = float(np.std(gray_roi))
    area_ratio = pixel_count / (width * height)

    looks_like_flame = (
        area_ratio < 0.45
        and body_ratio >= 0.008
        and (hot_ratio >= 0.0005 or brightness_std >= 42)
        and not (red_ratio >= 0.65 and hot_ratio < 0.002)
    )

    return looks_like_flame, {
        "hot_ratio": round(hot_ratio, 4),
        "body_ratio": round(body_ratio, 4),
        "red_ratio": round(red_ratio, 4),
        "brightness_std": round(brightness_std, 2),
        "area_ratio": round(area_ratio, 4),
    }


def get_camera_health(image_np):
    global last_frame_hash, same_frame_count, last_frame_received_at

    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    brightness = float(np.mean(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    small = cv2.resize(gray, (32, 24), interpolation=cv2.INTER_AREA)
    frame_hash = small.tobytes()

    if frame_hash == last_frame_hash:
        same_frame_count += 1
    else:
        same_frame_count = 0

    last_frame_hash = frame_hash
    last_frame_received_at = time.time()

    issues = []
    if brightness < 28:
        issues.append("too_dark")
    if brightness > 245:
        issues.append("overexposed")
    if sharpness < 35:
        issues.append("blurry")
    if same_frame_count >= 8:
        issues.append("possible_frozen_frame")

    status = "ok"
    if issues:
        status = "warning"
    if "too_dark" in issues or "possible_frozen_frame" in issues:
        status = "problem"

    return {
        "status": status,
        "issues": issues,
        "brightness": round(brightness, 2),
        "sharpness": round(sharpness, 2),
        "same_frame_count": same_frame_count,
        "last_frame_age_seconds": 0,
    }
