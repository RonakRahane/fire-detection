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
