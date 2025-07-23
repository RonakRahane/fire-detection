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

    capture = cv2.VideoCapture(str(clip_path))
    frames = []
    index = 0

    while capture.isOpened() and len(frames) < 16:
        ok, frame = capture.read()
        if not ok:
            break
        if index % 2 == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            gif_frame = Image.fromarray(rgb_frame).resize(
                (480, 360), Image.Resampling.LANCZOS
            )
            frames.append(gif_frame)
        index += 1

    capture.release()

    if not frames:
        return False

    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=250,
        loop=0,
        optimize=True,
    )
    event["gif_url"] = f"/media/{gif_name}"
    event["clip_preview_url"] = event["gif_url"]
    return True


def hydrate_event_media(events):
    changed = False
    for event in events:
        changed = build_gif_preview_from_video(event) or changed
    if changed:
        save_events(events)
    return events


def save_gif_capture(event_id, fallback_frame=None):
    frames = list(recent_frames)
    if not frames and fallback_frame is not None:
        frames = [(time.time(), fallback_frame)]
    if not frames:
        return {"gif_url": None, "clip_preview_url": None}

    gif_name = f"{event_id}.gif"
    gif_path = MEDIA_DIR / gif_name
    first_frame = frames[0][1]
    height, width = first_frame.shape[:2]

    gif_frames = []
    for index, (_, frame) in enumerate(frames):
        if frame.shape[:2] != (height, width):
            frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

        if index % 2 == 0:
            gif_frame = Image.fromarray(frame).resize(
                (480, 360), Image.Resampling.LANCZOS
            )
            gif_frames.append(gif_frame)

    if gif_frames:
        gif_frames[0].save(
            gif_path,
            save_all=True,
            append_images=gif_frames[1:],
            duration=250,
            loop=0,
            optimize=True,
        )

    gif_url = f"/media/{gif_name}" if gif_path.exists() else None
    return {
        "gif_url": gif_url,
        "clip_preview_url": gif_url,
