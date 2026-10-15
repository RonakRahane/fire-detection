import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def _resolve_model_path(env_var: str, relative_file: str) -> Path:
    """Finds the model file whether running locally, in Docker, or on Render."""
    env_val = os.environ.get(env_var)
    if env_val and Path(env_val).is_file():
        return Path(env_val)
    # Check directly relative to config.py (e.g. BASE_DIR / models / fire_best.pt)
    local = BASE_DIR / relative_file
    if local.is_file():
        return local
    # Check common Render / container paths
    for root in [BASE_DIR.parent, Path("/opt/render/project/src")]:
        for candidate in [root / relative_file, root / "backend" / relative_file]:
            if candidate.is_file():
                return candidate
    return local

# Primary detector weights
CUSTOM_MODEL_PATH = _resolve_model_path("FIRE_MODEL_PATH", "models/fire_best.pt")
# COCO weights to identify people in smoke detections
PERSON_MODEL_PATH = _resolve_model_path("PERSON_MODEL_PATH", "yolov8n.pt")
# Optional secondary detector for indoor flames
INDOOR_FIRE_MODEL_PATH = _resolve_model_path("INDOOR_FIRE_MODEL_PATH", "models/fire_indoor_yolo26s.pt")
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
