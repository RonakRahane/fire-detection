import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
# FIRE_MODEL_PATH swaps in other weights without code changes (used to compare models on the same tests).
CUSTOM_MODEL_PATH = Path(os.environ.get("FIRE_MODEL_PATH") or BASE_DIR / "models" / "fire_best.pt")
# Stock COCO weights, used only for the person class (see SMOKE_ON_PERSON_SHARE).
PERSON_MODEL_PATH = BASE_DIR / "yolov8n.pt"
# Second fire detector: YOLO26-S trained on web fire photos (Hugging Face SalahALHaismawi/yolov26-fire-detection,
# MIT). It finds far more candle, match and fireplace flames than the D-FIRE model, so its fire boxes are added at
# 640 px and pass the same verification; its smoke class is ignored (it fires on clouds and fog). Optional: without
# the file the D-FIRE model runs alone. Measured in ml/README.md ("A second, indoor fire model").
# INDOOR_FIRE_MODEL_PATH="" turns it off (used to record the main model on its own for threshold tuning).
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

# Frames are scored at the 640 px training size first. When no fire passes there, they are scored again
# at 960 px for fire only: small or distant flames score far higher at that size (a lit match: 0.25 at
# 640 px, 0.72 at 960 px), while large, close fires and smoke are more reliable at 640 px (at 960 px,
# dark hair and rock or water textures scored 0.72–0.80 as smoke).
INFERENCE_IMAGE_SIZE = 640
DETAIL_IMAGE_SIZE = 960

# Oct 2026 threshold re-tune (ml/eval/tune_thresholds.py on D-FIRE, Commons flames, indoor rooms,
# lookalikes, and recorded webcam events).  The trained YOLO model itself detects 92.6% of fires;
# the old strict HSV/light-source checks were rejecting ~40% of those (core_luma >= 230 alone
# rejected 33.6%).  Lowering fire confidence to 0.25 and smoke to 0.30, with verification
# bypassed for the trained model, achieves Accuracy 92.8%, Fire Recall 91.6%, Hazard Recall
# 90.5% on D-FIRE (4,306 images).  False positives on single frames rise from 1.3% to 4.7%,
# but the 2-of-3 temporal confirmation (CONFIRM_FRAMES) eliminates transient single-frame
# false alarms in live mode.
ALERT_CONFIDENCE_BY_CLASS = {
    "fire": 0.25,
    "flame": 0.25,
    "smoke": 0.30,
}

# When True, fire boxes from the trained custom model are trusted at their confidence score
# without the HSV body/hot-core/light-source checks.  The YOLO model was trained on fire images
# and already learned colour and texture; the hand-crafted checks were written for the generic
# YOLO-World fallback.  Set to False to re-enable visual verification (lower recall, fewer
# false alarms on single frames).
TRUST_TRAINED_MODEL = True

# A fire box covering at least this share of the frame must show a hot core to pass verification.
LARGE_BOX_RATIO = 0.45

# A flame is a light source: its core is near-white and nothing just around it is as bright. Orange decor, paint
# and clothing are only lit by the room. Orange paint peaks near 160-190 luma; real flame cores measured 254-255.
LIGHT_CORE_MIN_LUMA = 230
# Share of the ring around a fire box that is as bright as the box's core. Real flames measured 0-7%; an orange
# decal on a white wall, 26%.
LIGHT_RING_MAX_BRIGHT_SHARE = 0.15

# A smoke box with at least this share inside a person box is hair or a head. Hair scored 0.56-0.80 as smoke
# in testing, and every such box sat 83-100% inside a person.
SMOKE_ON_PERSON_SHARE = 0.6

# A live signal must appear in this many of the most recent frames before it raises an alert.
CONFIRM_FRAMES = 2
CONFIRM_WINDOW = 3
CONFIRM_MAX_AGE_SECONDS = 8

EVENT_COOLDOWN_SECONDS = 15
MAX_EVENTS = 100

RECENT_FRAME_LIMIT = 16

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
