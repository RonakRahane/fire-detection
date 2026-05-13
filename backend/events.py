import json
import logging
import os
import threading
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from config import (
    CONFIRM_FRAMES,
    CONFIRM_MAX_AGE_SECONDS,
    CONFIRM_WINDOW,
    EVENTS_FILE,
    EVENT_COOLDOWN_SECONDS,
    FIRE_CLASSES,
    MAX_EVENTS,
    MEDIA_DIR,
    RECENT_FRAME_LIMIT,
)

logger = logging.getLogger("uvicorn.error")

recent_frames = deque(maxlen=RECENT_FRAME_LIMIT)
recent_signals = deque(maxlen=CONFIRM_WINDOW)
event_lock = threading.Lock()
last_event_at = 0.0


def remember_frame(image_np):
    recent_frames.append(image_np.copy())


def confirm_live_signal(fire, smoke):
    """Records one live frame's candidates and reports which signals held across the recent frames."""
    now = time.time()
    recent_signals.append((now, fire, smoke))
    window = [signal for signal in recent_signals if now - signal[0] <= CONFIRM_MAX_AGE_SECONDS]
    fire_frames = sum(1 for _, has_fire, _ in window if has_fire)
    smoke_frames = sum(1 for _, _, has_smoke in window if has_smoke)
    return {
        "window": CONFIRM_WINDOW,
        "required": CONFIRM_FRAMES,
        "fire_frames": fire_frames,
        "smoke_frames": smoke_frames,
        "fire_confirmed": fire and fire_frames >= CONFIRM_FRAMES,
        "smoke_confirmed": smoke and smoke_frames >= CONFIRM_FRAMES,
    }


def load_events():
    if not EVENTS_FILE.exists():
        return []
    try:
        return json.loads(EVENTS_FILE.read_text())
    except json.JSONDecodeError:
        # Keep the damaged file for recovery instead of letting the next save overwrite it.
        backup = EVENTS_FILE.with_name(f"events.corrupt-{int(time.time())}.json")
        EVENTS_FILE.replace(backup)
        logger.warning("events.json was unreadable; moved it to %s and started a new log", backup.name)
        return []


def save_events(events):
    # Write to a temporary file and swap it in, so a crash mid-write never truncates the log.
    temp_file = EVENTS_FILE.with_suffix(".json.tmp")
    temp_file.write_text(json.dumps(events, indent=2))
    os.replace(temp_file, EVENTS_FILE)


def media_path_from_url(media_url):
    if not media_url or not media_url.startswith("/media/"):
        return None

    filename = Path(media_url).name
    if not filename:
        return None

    return MEDIA_DIR / filename


def delete_event_media(events):
    # "clip_url" covers the MP4 clips that early versions recorded.
    for event in events:
        for key in ("snapshot_url", "gif_url", "clip_url"):
            path = media_path_from_url(event.get(key))
            if path and path.resolve().parent == MEDIA_DIR.resolve():
                path.unlink(missing_ok=True)


def save_gif_capture(event_id):
    """Encodes the buffered live frames as the event's GIF and returns its media URL."""
    gif_frames = [
        Image.fromarray(frame).resize((480, 360), Image.Resampling.LANCZOS)
        for frame in list(recent_frames)[::2]
    ]
    gif_name = f"{event_id}.gif"
    gif_frames[0].save(
        MEDIA_DIR / gif_name,
        save_all=True,
        append_images=gif_frames[1:],
        duration=250,
        loop=0,
        optimize=True,
    )
    return f"/media/{gif_name}"


def determine_alert(detections, color_heuristic_detected):
    alert_detections = [d for d in detections if d["confirmed"]]
    if not alert_detections:
        pending = [d for d in detections if d.get("alert_eligible")]
        if pending:
            best = max(pending, key=lambda d: d.get("confidence", 0))
            subject = "smoke" if best.get("class") == "smoke" else "fire"
            return "suspicious", f"Possible {subject} at {round(best['confidence'] * 100)}%, confirming"

        # Smoke boxes on a person are hair or heads, not a rejected fire signal.
        rejected_fire = any(
            d.get("class") in FIRE_CLASSES and not d.get("alert_eligible") and not d.get("on_person")
            for d in detections
        )
        if rejected_fire or color_heuristic_detected:
            return "suspicious", "Fire-like colors detected but rejected"
        return "safe", "No fire detected"

    best = max(alert_detections, key=lambda d: d.get("confidence", 0))
    cls_name = best.get("class")
    confidence = best.get("confidence", 0)

    if cls_name == "smoke":
        return "warning", f"Smoke detected at {round(confidence * 100)}%"
    if confidence >= 0.75:
        return "critical", f"Fire detected at {round(confidence * 100)}%"
    return "danger", f"Possible fire detected at {round(confidence * 100)}%"


def record_event(image_np, detections, alert_level, alert_summary, camera_health, using_custom_fire_model):
    global last_event_at

    now = time.time()
    if now - last_event_at < EVENT_COOLDOWN_SECONDS:
        return None

    event_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now(timezone.utc).isoformat()

    snapshot_name = f"{event_id}.jpg"
    snapshot_path = MEDIA_DIR / snapshot_name
    Image.fromarray(image_np).save(snapshot_path, quality=92)

    gif_url = save_gif_capture(event_id)

    alert_detections = [d for d in detections if d["confirmed"]]
    best_detection = max(
        alert_detections, key=lambda d: d.get("confidence", 0), default=None
    )

    event = {
        "id": event_id,
        "timestamp": timestamp,
        "alert_level": alert_level,
        "summary": alert_summary,
        "snapshot_url": f"/media/{snapshot_name}",
        "gif_url": gif_url,
        "best_detection": best_detection,
        "detections": detections,
        "camera_health": camera_health,
        "model": "custom_fire_best.pt" if using_custom_fire_model else "yolov8s-worldv2 fallback",
    }

    with event_lock:
        events = load_events()
        events.insert(0, event)
        save_events(events[:MAX_EVENTS])
        delete_event_media(events[MAX_EVENTS:])
        last_event_at = now

    return event


def delete_event(event_id):
    """Removes one event and its snapshot and GIF. Returns False when no event has that id."""
    with event_lock:
        events = load_events()
        removed = [event for event in events if event.get("id") == event_id]
        if not removed:
            return False
        save_events([event for event in events if event.get("id") != event_id])
        delete_event_media(removed)
    return True


def clear_events():
    """Removes every event and its media. Returns how many events were deleted."""
    with event_lock:
        events = load_events()
        save_events([])
        delete_event_media(events)
    return len(events)
