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
