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

