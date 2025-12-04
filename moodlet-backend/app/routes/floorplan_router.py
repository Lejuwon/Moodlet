from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import os

from app.database import get_db
from app.models.floorplan import Floorplan
from app.models.floorplan import FloorplanObject
from app.ai.layout_planner.detector import analyze_floorplan_with_gpt

router = APIRouter()

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(ROOT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/floorplan/upload")
async def upload_floorplan(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = f"{datetime.now().timestamp()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # 1) 저장
    with open(filepath, "wb") as f:
        f.write(await file.read())

    image_url = f"/static/{filename}"

    # 2) 분석
    result = analyze_floorplan_with_gpt(filepath)

    # 3) floorplan 저장
    fp = Floorplan(image_url=image_url, meta_json=result)
    db.add(fp)
    db.commit()
    db.refresh(fp)

    # 4) floorplan_object 저장
    objects = []

    # walls
    for w in result.get("walls", []):
        objects.append(FloorplanObject(
            fp_id=fp.fp_id,
            type="wall",
            position_json=w,
        ))

    # doors/windows
    for d in result.get("doors", []):
        objects.append(FloorplanObject(
            fp_id=fp.fp_id,
            type="door",
            position_json=d,
        ))

    for win in result.get("windows", []):
        objects.append(FloorplanObject(
            fp_id=fp.fp_id,
            type="window",
            position_json=win,
        ))

    # 방 타입
    for room in result.get("rooms", []):
        objects.append(FloorplanObject(
            fp_id=fp.fp_id,
            type="room",
            position_json=room,
        ))

    for obj in objects:
        db.add(obj)

    db.commit()

    return {
        "message": "ok",
        "fp_id": fp.fp_id,
        "objects": len(objects)
    }


@router.get("/floorplan/json/{fp_id}")
def get_floorplan_json(fp_id: int, db: Session = Depends(get_db)):
    fp = db.query(Floorplan).filter(Floorplan.fp_id == fp_id).first()
    if not fp:
        return {"error": "not found"}

    return fp.meta_json