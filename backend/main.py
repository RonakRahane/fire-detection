import io
import logging
import threading
import time

import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

from config import (
    ALERT_CONFIDENCE_BY_CLASS,
    BASE_DIR,
    CUSTOM_MODEL_PATH,
    TRUST_TRAINED_MODEL,
    DETAIL_IMAGE_SIZE,
    FIRE_CLASSES,
    FLAME_CLASSES,
    FRONTEND_DIST,
    INDOOR_FIRE_MIN_CONFIDENCE,
    INDOOR_FIRE_MODEL_PATH,
    INFERENCE_IMAGE_SIZE,
    MAX_UPLOAD_BYTES,
    MEDIA_DIR,
    PERSON_MODEL_PATH,
    SMOKE_ON_PERSON_SHARE,
)
from events import (
    clear_events,
    confirm_live_signal,
    delete_event,
    determine_alert,
    event_lock,
    load_events,
    record_event,
    remember_frame,
)
from vision import box_overlap_share, fire_color_heuristic, fire_visual_signature, get_camera_health

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Fire Detection API",
    description="YOLOv8-powered fire, flame, and smoke detection with event logging.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

if CUSTOM_MODEL_PATH.exists():
    model = YOLO(str(CUSTOM_MODEL_PATH))
    using_custom_fire_model = True
else:
    from ultralytics import YOLOWorld

    logger.warning(
        "Custom fire model not found at %s. Falling back to YOLO-World, which is far less accurate for fire.",
        CUSTOM_MODEL_PATH,
    )
    model = YOLOWorld(str(BASE_DIR / "yolov8s-worldv2.pt"))
    model.set_classes([
        "person", "face", "spectacles", "glasses", "sunglasses",
        "pencil", "pen", "book", "notebook",
        "mouse", "computer mouse", "cup", "bottle",
        "fire", "flame", "smoke",
    ])
    using_custom_fire_model = False

# Finds people so smoke boxes on hair and heads can be dropped. Optional: without the weights, smoke is not checked.
if PERSON_MODEL_PATH.exists():
    person_model = YOLO(str(PERSON_MODEL_PATH))
else:
    person_model = None
    logger.warning("Person model not found at %s. Smoke boxes on people will not be filtered.", PERSON_MODEL_PATH)

# Second fire detector for small indoor flames (see config.INDOOR_FIRE_MODEL_PATH). Optional.
indoor_fire_model = YOLO(str(INDOOR_FIRE_MODEL_PATH)) if INDOOR_FIRE_MODEL_PATH.is_file() else None


# YOLO inference, the frozen-feed tracker and the live confirmation buffer are shared state,
# so frames are analysed one at a time, off the event loop.
detection_lock = threading.Lock()


@app.post("/detect")
def detect(
    file: UploadFile = File(...),
    live: bool = Query(
        default=False,
        description="True for monitoring-console camera frames. Only live frames feed camera health, "
        "need confirmation across frames, and can record events.",
    ),
):
    contents = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is larger than 15 MB.")
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError):
        raise HTTPException(status_code=400, detail="Upload is not a readable image.") from None

    with detection_lock:
        return analyze_frame(pil_image, np.array(pil_image), live)


def score_frame(pil_image, image_np, image_size):
    """Runs the model at one input size and checks every fire box against its colour signature."""
    results = model.predict(
        pil_image,
        conf=0.15 if using_custom_fire_model else 0.30,
        iou=0.45,
        agnostic_nms=True,
        imgsz=image_size,
        verbose=False,
    )

    detections = []
    for result in results:
        for box in result.boxes:
            cls_name = model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            alert_threshold = ALERT_CONFIDENCE_BY_CLASS.get(cls_name, 1.01)
            visual_signature = None
            verified_fire_like = True

            if cls_name in FLAME_CLASSES:
                if TRUST_TRAINED_MODEL and using_custom_fire_model:
                    # The trained model's confidence is sufficient; visual signature is still
                    # recorded for diagnostics but does not gate the alert decision.
                    _, visual_signature = fire_visual_signature(image_np, xyxy)
                else:
                    verified_fire_like, visual_signature = fire_visual_signature(image_np, xyxy)

            detections.append({
                "class": cls_name,
                "confidence": conf,
                "box": xyxy,
                "source": "custom_model" if using_custom_fire_model else "yolo_world",
                "image_size": image_size,
                "alert_eligible": cls_name in FIRE_CLASSES and conf >= alert_threshold and verified_fire_like,
                "verified_fire_like": verified_fire_like,
                "visual_signature": visual_signature,
            })
    return detections


def score_indoor_fire(pil_image, image_np):
    """Fire boxes from the second detector at 640 px, verified like the main model's. Its smoke class is not used."""
    if indoor_fire_model is None:
        return []
    result = indoor_fire_model.predict(
        pil_image, conf=0.15, iou=0.45, agnostic_nms=True, imgsz=INFERENCE_IMAGE_SIZE, verbose=False,
    )[0]
    detections = []
    for box in result.boxes:
        if indoor_fire_model.names[int(box.cls[0])].lower() != "fire":
            continue
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()
        if TRUST_TRAINED_MODEL:
            _, visual_signature = fire_visual_signature(image_np, xyxy)
            verified_fire_like = True
        else:
            verified_fire_like, visual_signature = fire_visual_signature(image_np, xyxy)
        detections.append({
            "class": "fire",
            "confidence": conf,
            "box": xyxy,
            "source": "indoor_model",
            "image_size": INFERENCE_IMAGE_SIZE,
            "alert_eligible": conf >= INDOOR_FIRE_MIN_CONFIDENCE and verified_fire_like,
            "verified_fire_like": verified_fire_like,
            "visual_signature": visual_signature,
        })
    return detections


def reject_smoke_on_people(pil_image, detections):
    """Marks smoke boxes that sit on a person (hair, heads) as on_person and not alert-eligible."""
    smoke = [d for d in detections if d["class"] == "smoke"]
    if not smoke or person_model is None:
        return

    result = person_model.predict(pil_image, classes=[0], conf=0.25, imgsz=INFERENCE_IMAGE_SIZE, verbose=False)[0]
    people = result.boxes.xyxy.tolist()
    for d in smoke:
        share = max((box_overlap_share(d["box"], person) for person in people), default=0.0)
        d["person_overlap"] = round(share, 2)
        d["on_person"] = share >= SMOKE_ON_PERSON_SHARE
        if d["on_person"]:
            d["alert_eligible"] = False


def analyze_frame(pil_image, image_np, live):
    camera_health = get_camera_health(image_np, live=live)
    if live:
        remember_frame(image_np)

    detections = score_frame(pil_image, image_np, INFERENCE_IMAGE_SIZE)
    if not any(d["alert_eligible"] and d["class"] in FLAME_CLASSES for d in detections):
        # Second look for small or distant flames. Only fire boxes are taken from the larger pass.
        detail = score_frame(pil_image, image_np, DETAIL_IMAGE_SIZE)
        detections = [d for d in detections if d["class"] not in FLAME_CLASSES]
        detections += [d for d in detail if d["class"] in FLAME_CLASSES]
    detections += score_indoor_fire(pil_image, image_np)

    reject_smoke_on_people(pil_image, detections)
    heuristic_fire_detected = fire_color_heuristic(image_np)

    # A live signal only counts once it holds across recent frames; a single uploaded image stands alone.
    confirmation = None
    if live:
        candidates = {d["class"] for d in detections if d["alert_eligible"]}
        confirmation = confirm_live_signal(
            fire=bool(candidates & FLAME_CLASSES),
            smoke="smoke" in candidates,
        )
    for d in detections:
        d["confirmed"] = d["alert_eligible"] and (
            not live
            or (d["class"] in FLAME_CLASSES and confirmation["fire_confirmed"])
            or (d["class"] == "smoke" and confirmation["smoke_confirmed"])
        )

    is_fire = any(d["confirmed"] for d in detections)
    alert_level, alert_summary = determine_alert(detections, heuristic_fire_detected)

    event = None
    if is_fire and live:
        event = record_event(
            image_np, detections, alert_level, alert_summary,
            camera_health, using_custom_fire_model,
        )

    return {
        "detections": detections,
        "fire_detected": is_fire,
        "alert_level": alert_level,
        "alert_summary": alert_summary,
        "color_heuristic_detected": heuristic_fire_detected,
        "camera_health": camera_health,
        "confirmation": confirmation,
        "event": event,
        "frame": {
            "width": image_np.shape[1],
            "height": image_np.shape[0],
        },
        "model": "custom_fire_best.pt" if using_custom_fire_model else "yolov8s-worldv2 fallback",
    }


@app.get("/")
def read_root():
    if FRONTEND_DIST.exists():
        return FileResponse(str(FRONTEND_DIST / "index.html"))
    return {"status": "Fire Detection API is running"}


@app.get("/events")
def get_events(limit: int = Query(default=25, ge=1, le=100)):
    with event_lock:
        return {"events": load_events()[:limit]}


@app.delete("/events/{event_id}")
def remove_event(event_id: str):
    if not delete_event(event_id):
        raise HTTPException(status_code=404, detail="Event not found.")
    return {"deleted": event_id}


@app.delete("/events")
def remove_all_events():
    return {"deleted_count": clear_events()}


@app.get("/camera-health")
def camera_health_status():
    from vision import last_frame_received_at as _last_received

    if _last_received == 0:
        return {
            "status": "problem",
            "issues": ["no_frames_received"],
            "last_frame_age_seconds": None,
        }

    age = round(time.time() - _last_received, 2)
    status = "ok" if age < 5 else "problem"
    issues = [] if age < 5 else ["no_recent_frames"]
    return {
        "status": status,
        "issues": issues,
        "last_frame_age_seconds": age,
    }
