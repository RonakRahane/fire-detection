# Event management module for persisting fire alerts, snapshots, and video clip previews.
# Handles event logging cooldowns, recent frame buffering, and animated GIF preview generation.

import json
import threading
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from config import (
    EVENTS_FILE,
    EVENT_COOLDOWN_SECONDS,
    FIRE_CLASSES,
    MEDIA_DIR,
    RECENT_FRAME_LIMIT,
)

recent_frames = deque(maxlen=RECENT_FRAME_LIMIT)
event_lock = threading.Lock()
last_event_at = 0.0


def remember_frame(image_np):
    recent_frames.append((time.time(), image_np.copy()))


def load_events():
    if not EVENTS_FILE.exists():
        return []
    try:
        return json.loads(EVENTS_FILE.read_text())
    except json.JSONDecodeError:
        return []


def save_events(events):
    EVENTS_FILE.write_text(json.dumps(events, indent=2))


def media_path_from_url(media_url):
    if not media_url or not media_url.startswith("/media/"):
        return None

    filename = Path(media_url).name
    if not filename:
        return None

    return MEDIA_DIR / filename


def build_gif_preview_from_video(event):
    if event.get("gif_url"):
        return False

    if event.get("clip_preview_url"):
        event["gif_url"] = event.get("clip_preview_url")
        return True

    clip_path = media_path_from_url(event.get("clip_url"))
    if not clip_path or not clip_path.exists():
        return False

    gif_name = f"{clip_path.stem}.gif"
    gif_path = MEDIA_DIR / gif_name
    if gif_path.exists():
        event["gif_url"] = f"/media/{gif_name}"
        event["clip_preview_url"] = event["gif_url"]
        return True

