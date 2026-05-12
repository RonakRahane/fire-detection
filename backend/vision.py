import time

import cv2
import numpy as np

from config import (
    LARGE_BOX_RATIO,
    LIGHT_CORE_MIN_LUMA,
    LIGHT_RING_MAX_BRIGHT_SHARE,
)

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


def box_overlap_share(box, other):
    """Share of box's area that lies inside other. Boxes are [x1, y1, x2, y2]."""
    overlap_w = max(0.0, min(box[2], other[2]) - max(box[0], other[0]))
    overlap_h = max(0.0, min(box[3], other[3]) - max(box[1], other[1]))
    area = max(1e-6, (box[2] - box[0]) * (box[3] - box[1]))
    return overlap_w * overlap_h / area


def light_source(image_np, x1, y1, x2, y2):
    """Brightness of the box's core (98th-percentile luma), and the share of a ring around the box that is as
    bright as that core. The share is None when the box leaves too little ring to judge."""
    height, width = image_np.shape[:2]
    margin = max(8, max(x2 - x1, y2 - y1) // 2)
    rx1, ry1 = max(0, x1 - margin), max(0, y1 - margin)
    rx2, ry2 = min(width, x2 + margin), min(height, y2 + margin)

    gray = cv2.cvtColor(image_np[ry1:ry2, rx1:rx2], cv2.COLOR_RGB2GRAY)
    ring = np.ones(gray.shape, dtype=bool)
    ring[y1 - ry1:y2 - ry1, x1 - rx1:x2 - rx1] = False

    core_luma = float(np.percentile(gray[~ring], 98))
    ring_pixels = gray[ring]
    if ring_pixels.size < 50:
        return core_luma, None
    return core_luma, float(np.mean(ring_pixels >= core_luma - 10))


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
            "core_luma": 0,
            "ring_bright_share": None,
            "light_source": False,
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

    has_flame_core = hot_ratio >= 0.0005 or brightness_std >= 42
    if area_ratio >= LARGE_BOX_RATIO:
        # Either a fire close to the camera or a warm colour cast over the whole scene: insist on a hot core.
        has_flame_core = hot_ratio >= 0.002

    # Orange decor, paint and clothing pass the colour tests above; they fail here because they do not glow.
    core_luma, ring_bright_share = light_source(image_np, x1, y1, x2, y2)
    is_light_source = core_luma >= LIGHT_CORE_MIN_LUMA and (
        ring_bright_share is None or ring_bright_share <= LIGHT_RING_MAX_BRIGHT_SHARE
    )

    # Red pixels count as flame body too: outdoor and smoky fires burn red, and with an orange-only body test the
    # pipeline dropped about 1 in 5 real D-FIRE fires that the model had found (ml/README.md, threshold re-tuning).
    looks_like_flame = (
        body_ratio + red_ratio >= 0.008
        and has_flame_core
        and not (red_ratio >= 0.65 and hot_ratio < 0.002)
        and is_light_source
    )

    return looks_like_flame, {
        "hot_ratio": round(hot_ratio, 4),
        "body_ratio": round(body_ratio, 4),
        "red_ratio": round(red_ratio, 4),
        "brightness_std": round(brightness_std, 2),
        "area_ratio": round(area_ratio, 4),
        "core_luma": round(core_luma, 1),
        "ring_bright_share": None if ring_bright_share is None else round(ring_bright_share, 4),
        "light_source": is_light_source,
    }


def fire_color_heuristic(image_np):
    """Flags compact, high-contrast regions in flame colours. Only ever marks a frame as suspicious."""
    hsv = cv2.cvtColor(image_np, cv2.COLOR_RGB2HSV)

    lower_hot = np.array([10, 35, 245], dtype="uint8")
    upper_hot = np.array([45, 180, 255], dtype="uint8")
    mask_hot = cv2.inRange(hsv, lower_hot, upper_hot)

    lower_body = np.array([8, 120, 170], dtype="uint8")
    upper_body = np.array([38, 255, 255], dtype="uint8")
    mask_body = cv2.inRange(hsv, lower_body, upper_body)

    mask = mask_hot | mask_body
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    image_area = image_np.shape[0] * image_np.shape[1]
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        area_ratio = area / image_area
        if 20 < area and area_ratio < 0.08:
            x, y, w, h = cv2.boundingRect(cnt)
            roi = image_np[y:y + h, x:x + w]
            roi_hot = mask_hot[y:y + h, x:x + w]
            roi_body = mask_body[y:y + h, x:x + w]

            if roi.size > 0:
                gray_roi = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
                std_dev = np.std(gray_roi)
                hot_pixels = cv2.countNonZero(roi_hot)
                body_pixels = cv2.countNonZero(roi_body)

                if hot_pixels >= 3 and body_pixels >= 8 and std_dev > 45:
                    return True
    return False


def get_camera_health(image_np, live=True):
    """Frame quality for this image. Only live camera frames feed the frozen-feed tracker and heartbeat."""
    global last_frame_hash, same_frame_count, last_frame_received_at

    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    brightness = float(np.mean(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    if live:
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
    if live and same_frame_count >= 8:
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
        "same_frame_count": same_frame_count if live else 0,
        "last_frame_age_seconds": 0,
    }
