from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
import random
from pydantic import BaseModel

from app.models.floorplan import LayoutSession, LayoutFurnitureItem
from app.models.furniture import FurnitureProduct
from app.models.floorplan import Floorplan,  FloorplanObject
from app.models.floorplan import LayoutSession

from app.ai.layout_planner.gpt_layout_planner import run_gpt_layout

router = APIRouter()

@router.post("/layout/start")
async def start_layout(data: dict, db: Session = Depends(get_db)):
    fp_id = data["fp_id"]
    furniture_ids = data["furniture_ids"]

    # 1) layout_session 생성
    session = LayoutSession(
        fp_id=fp_id,
        user_id=None,
        status="PROCESSING",
        model_used="gpt-4o"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 2) GPT Layout Planner 실행
    result = run_gpt_layout(db, fp_id, furniture_ids)

    # 3) 결과 저장
    for r in result:
        item = LayoutFurnitureItem(
            layout_id=session.layout_id,
            furniture_id=r["furniture_id"],
            position_json=r["position"],
            size_json=r["size"],
            rotation_deg=r["rotation"],
            confidence=r["confidence"],
            z_index=r["z_index"],
        )
        db.add(item)

    # 4) 상태 변경
    session.status = "SUCCESS"
    session.completed_at = datetime.now()
    db.commit()

    return {"layout_id": session.layout_id}

@router.get("/layout/result/{layout_id}")
async def get_layout_result(layout_id: int, db: Session = Depends(get_db)):
    items = db.query(LayoutFurnitureItem).filter(
        LayoutFurnitureItem.layout_id == layout_id
    ).all()

    return {
        "items": [
            {
                "lf_id": i.lf_id,
                "furniture_id": i.furniture_id,
                "position": i.position_json,
                "size": i.size_json,
                "rotation": i.rotation_deg,
            }
            for i in items
        ]
    }

class LayoutRequest(BaseModel):
    fp_id: int
    categories: list[str]


# 🔥 프론트 → 실제 DB 카테고리 자동 변환 매핑
CATEGORY_MAP = {
    "bed": ["bed_frame", "mattress"],
    "desk": ["desk"],
    "chair": ["chair"],
    "sofa": ["sofa"],
    "dresser": ["dresser"],
    "wardrobe": ["wardrobe"],
}


# @router.post("/layout/run")
# def run_layout(payload: dict, db: Session = Depends(get_db)):
#     fp_id = payload.get("fp_id")
#     categories = payload.get("categories", [])
#     user_id = payload.get("user_id")

#     if not fp_id or not categories:
#         return {"error": "fp_id and categories are required"}

#     # 🔥 categories → 실제 DB 카테고리로 매핑
#     mapped_categories = []
#     for cat in categories:
#         mapped_categories.extend(CATEGORY_MAP.get(cat, []))

#     if not mapped_categories:
#         return {"error": "no valid categories provided"}

#     # 1) LayoutSession 생성
#     session = LayoutSession(
#         fp_id=fp_id,
#         user_id=user_id,
#         status="SUCCESS",
#         model_used="gpt-layout"
#     )
#     db.add(session)
#     db.commit()
#     db.refresh(session)

#     layout_id = session.layout_id

#     # 2) Floorplan 및 객체 불러오기
#     fp = db.query(Floorplan).filter(Floorplan.fp_id == fp_id).first()
#     fp_objects = db.query(FloorplanObject).filter(FloorplanObject.fp_id == fp_id).all()

#     # 3) 스타일 필터링 + 카테고리 매칭
#     candidates = (
#         db.query(FurnitureProduct)
#         .filter(FurnitureProduct.category.in_(mapped_categories))
#         .filter(FurnitureProduct.style_id == 2)
#         .order_by(FurnitureProduct.width.asc())  # width 컬럼명 맞게 수정됨
#         .all()
#     )

#     if not candidates:
#         return {"error": "No matching furniture found"}

#     placed = []

#     # 4) 가구 배치 (임시 랜덤 → 나중에 GPT 배치로 교체)
#     for item in candidates:

#         pos = {
#             "x": random.randint(60, 280),
#             "y": random.randint(80, 300),
#         }

#         lf = LayoutFurnitureItem(
#             layout_id=layout_id,
#             furniture_id=item.product_id,
#             position_json=pos,
#             size_json={
#                 "width": float(item.width or 80),
#                 "depth": float(item.depth or 40),
#                 "height": float(item.height or 10),
#             },
#             rotation_deg=0,
#             confidence=0.8,
#         )

#         db.add(lf)
#         placed.append({
#             "furniture_id": item.product_id,
#             "name": item.name,
#             "position": pos,
#         })

#     db.commit()

#     return {
#         "layout_id": layout_id,
#         "placed_count": len(placed),
#         "items": placed,
#     }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.floorplan import LayoutSession
from app.models.furniture import FurnitureProduct  # 스타일 2번 제품들 가져올 때 사용
from app.schemas.layout import LayoutRunRequest
from sqlalchemy import and_
from datetime import datetime

router = APIRouter()

@router.post("/layout/run")
def run_layout(request: LayoutRunRequest, db: Session = Depends(get_db)):

    # 1) 새로운 layout_session 생성
    layout_session = LayoutSession(
        fp_id=request.fp_id,
        user_id=1,              # 로그인 기능 없다면 임시 값
        status="SUCCESS",
        model_used="v1",
        completed_at=datetime.now()
    )

    db.add(layout_session)
    db.commit()
    db.refresh(layout_session)

    layout_id = layout_session.layout_id

    # 2) 스타일 ID = 2 에 해당하는 가구만 조회
    products = db.query(FurnitureProduct).filter(FurnitureProduct.style_id == 2).all()

    # 3) JSON 형태로 응답
    return {
        "layout_id": layout_id,
        "recommended": [
            {
                "product_id": p.product_id,
                "name": p.name,
                "price": p.price,
                "image": p.image_url,
            }
            for p in products
        ]
    }


@router.get("/layout/result/{layout_id}")
def get_layout_result(layout_id: int, db: Session = Depends(get_db)):
    session = db.query(LayoutSession).filter(LayoutSession.layout_id == layout_id).first()
    if not session:
        return {"error": "layout not found"}

    floorplan = db.query(Floorplan).filter(Floorplan.fp_id == session.fp_id).first()

    items = (
        db.query(LayoutFurnitureItem)
        .filter(LayoutFurnitureItem.layout_id == layout_id)
        .all()
    )

    output = []
    for it in items:
        furniture = db.query(FurnitureProduct).filter(FurnitureProduct.product_id == it.furniture_id).first()
        output.append({
            "furniture_id": it.furniture_id,
            "name": furniture.name if furniture else None,
            "position": it.position_json,
            "size": it.size_json,
            "rotation": float(it.rotation_deg or 0),
        })

    return {
        "layout_id": layout_id,
        "image_url": floorplan.image_url,  # 🔥 추가
        "items": output
    }