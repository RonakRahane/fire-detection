import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
# Override the primary detector weights with FIRE_MODEL_PATH.
CUSTOM_MODEL_PATH = Path(os.environ.get("FIRE_MODEL_PATH") or BASE_DIR / "models" / "fire_best.pt")
# COCO weights are used to identify people in smoke detections.
PERSON_MODEL_PATH = BASE_DIR / "yolov8n.pt"
# Optional secondary detector for indoor flames; its smoke predictions are ignored.
INDOOR_FIRE_MODEL_PATH = Path(os.environ.get("INDOOR_FIRE_MODEL_PATH", BASE_DIR / "models" / "fire_indoor_yolo26s.pt"))
INDOOR_FIRE_MIN_CONFIDENCE = 0.70
EVENTS_DIR = BASE_DIR / "events"
MEDIA_DIR = EVENTS_DIR / "media"
EVENTS_FILE = EVENTS_DIR / "events.json"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

EVENTS_DIR.mkdir(exist_ok=True)
MEDIA_DIR.mkdir(exist_ok=True)

FIRE_CLASSES = {"fire", "flame", "smoke"}
FLAME_CLASSES = {"fire", "flame"}

# Retry fire detections at a larger size when no fire passes the base-size inference.
INFERENCE_IMAGE_SIZE = 640
DETAIL_IMAGE_SIZE = 960

ALERT_CONFIDENCE_BY_CLASS = {
    "fire": 0.25,
    "flame": 0.25,
    "smoke": 0.30,
}

# Trust detections from the fire-trained model without generic visual verification.
TRUST_TRAINED_MODEL = True

LARGE_BOX_RATIO = 0.45

LIGHT_CORE_MIN_LUMA = 230
LIGHT_RING_MAX_BRIGHT_SHARE = 0.15

SMOKE_ON_PERSON_SHARE = 0.6

CONFIRM_FRAMES = 2
CONFIRM_WINDOW = 3
CONFIRM_MAX_AGE_SECONDS = 8

EVENT_COOLDOWN_SECONDS = 15
MAX_EVENTS = 100

RECENT_FRAME_LIMIT = 16

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
