# Central configuration module for the fire detection system.
# Defines filesystem paths, YOLO model parameters, confidence thresholds, and frame limits.

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CUSTOM_MODEL_PATH = BASE_DIR / "models" / "fire_best.pt"
EVENTS_DIR = BASE_DIR / "events"
MEDIA_DIR = EVENTS_DIR / "media"
EVENTS_FILE = EVENTS_DIR / "events.json"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

EVENTS_DIR.mkdir(exist_ok=True)
MEDIA_DIR.mkdir(exist_ok=True)

FIRE_CLASSES = {"fire", "flame", "smoke"}

ALERT_CONFIDENCE_BY_CLASS = {
    "fire": 0.35,
    "flame": 0.35,
    "smoke": 0.55,
}

EVENT_COOLDOWN_SECONDS = 15

RECENT_FRAME_LIMIT = 16
