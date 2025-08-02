# FastAPI web server entrypoint exposing HTTP endpoints for object detection and event history.
# Orchestrates YOLO inference, HSV color verification, static media serving, and camera health routing.

import io

import cv2
import numpy as np
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from ultralytics import YOLO

from config import (
    ALERT_CONFIDENCE_BY_CLASS,
    BASE_DIR,
    CUSTOM_MODEL_PATH,
    FIRE_CLASSES,
    FRONTEND_DIST,
    MEDIA_DIR,
)
from events import (
    determine_alert,
    event_lock,
    hydrate_event_media,
    load_events,
    record_event,
    remember_frame,
)
from vision import fire_visual_signature, get_camera_health, last_frame_received_at

app = FastAPI(
    title="Fire Detection API",
    description="YOLOv8-powered fire, flame, and smoke detection with event logging.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

    model = YOLOWorld(str(BASE_DIR / "yolov8s-worldv2.pt"))
    model.set_classes([
        "person", "face", "spectacles", "glasses", "sunglasses",
        "pencil", "pen", "book", "notebook",
        "mouse", "computer mouse", "cup", "bottle",
        "fire", "flame", "smoke",
    ])
    using_custom_fire_model = False


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    is_live_capture = file.filename == "capture.jpg"

    contents = await file.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(pil_image)

    camera_health = get_camera_health(image_np)
    if is_live_capture:
        remember_frame(image_np)

    predict_conf = 0.15 if using_custom_fire_model else 0.30
    results = model.predict(
        pil_image,
        conf=predict_conf,
        iou=0.45,
        agnostic_nms=True,
        imgsz=640,
    )

    detections = []
    model_fire_detected = False

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            alert_threshold = ALERT_CONFIDENCE_BY_CLASS.get(cls_name, 1.01)
            visual_signature = None
            verified_fire_like = True

            if using_custom_fire_model and cls_name in {"fire", "flame"}:
                verified_fire_like, visual_signature = fire_visual_signature(image_np, xyxy)

            alert_eligible = (
                cls_name in FIRE_CLASSES
                and conf >= alert_threshold
                and verified_fire_like
            )

            detections.append({
                "class": cls_name,
                "confidence": conf,
                "box": xyxy,
                "source": "custom_model" if using_custom_fire_model else "yolo_world",
                "alert_eligible": alert_eligible,
                "verified_fire_like": verified_fire_like,
                "visual_signature": visual_signature,
            })

            if alert_eligible:
                model_fire_detected = True

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

    heuristic_fire_detected = False
    heuristic_box = None

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
                    heuristic_fire_detected = True
                    heuristic_box = [float(x), float(y), float(x + w), float(y + h)]
                    break

    is_fire = model_fire_detected or (
        heuristic_fire_detected and not using_custom_fire_model
    )

    if is_fire:
        if not any(d["class"] == "fire" for d in detections):
            detections.append({
                "class": "fire",
                "confidence": 0.5,
                "box": heuristic_box or [0, 0, image_np.shape[1], image_np.shape[0]],
                "source": "color_heuristic",
                "alert_eligible": not using_custom_fire_model,
            })

    alert_level, alert_summary = determine_alert(detections, heuristic_fire_detected)
    event = None
    if is_fire and is_live_capture:
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
        "event": event,
        "event_recording": "live_capture_only",
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
        events = hydrate_event_media(load_events())
        return {"events": events[:limit]}


@app.get("/camera-health")
def camera_health_status():
    from vision import last_frame_received_at as _last_received

    if _last_received == 0:
        return {
            "status": "problem",
            "issues": ["no_frames_received"],
            "last_frame_age_seconds": None,
        }

    import time
    age = round(time.time() - _last_received, 2)
    status = "ok" if age < 5 else "problem"
    issues = [] if age < 5 else ["no_recent_frames"]
    return {
        "status": status,
        "issues": issues,
        "last_frame_age_seconds": age,
    }
