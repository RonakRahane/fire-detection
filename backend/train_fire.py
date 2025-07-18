# Standalone training script for fine-tuning YOLOv8 object detection on the D-FIRE dataset.
# Parses command-line hyperparameters, checks hardware acceleration (CUDA/MPS), and saves model weights.

from argparse import ArgumentParser
from pathlib import Path

import torch
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parent


def get_default_device() -> str:
    if torch.cuda.is_available():
        return "0"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def parse_args():
    parser = ArgumentParser(description="Train the fire/smoke YOLO detector on D-FIRE.")
    parser.add_argument(
        "--data",
        default=ROOT_DIR / "D-FIRE" / "data.yaml",
        type=Path,
        help="Path to D-FIRE data.yaml.",
    )
    parser.add_argument(
        "--model",
        default=BACKEND_DIR / "yolov8m.pt",
        type=Path,
        help="Base YOLO model weights.",
    )
    parser.add_argument("--epochs", default=100, type=int)
    parser.add_argument("--imgsz", default=960, type=int)
    parser.add_argument("--batch", default=8, type=int)
    parser.add_argument("--patience", default=20, type=int)
    parser.add_argument("--workers", default=4, type=int)
    parser.add_argument("--fraction", default=1.0, type=float)
    parser.add_argument("--device", default=get_default_device())
    parser.add_argument("--name", default="fire_smoke_yolov8m")
    parser.add_argument("--project", default=BACKEND_DIR / "runs" / "detect", type=Path)
    parser.add_argument("--cache", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()

    if not args.data.exists():
        raise FileNotFoundError(f"Dataset config not found: {args.data}")
    if not args.model.exists():
        raise FileNotFoundError(f"Base model not found: {args.model}")

    print(f"Dataset: {args.data}")
    print(f"Model: {args.model}")
    print(f"Device: {args.device}")

    model = YOLO(str(args.model))
    model.train(
        data=str(args.data),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        patience=args.patience,
        workers=args.workers,
        fraction=args.fraction,
        device=args.device,
        project=str(args.project),
        name=args.name,
        cache=args.cache,
        plots=True,
    )

    run_dir = args.project / args.name
    print(f"Training complete. Best model should be at: {run_dir / 'weights' / 'best.pt'}")


if __name__ == "__main__":
    main()
