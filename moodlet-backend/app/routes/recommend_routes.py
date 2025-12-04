from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.survey import SessionStyleResult
from app.models.furniture import FurnitureProduct
from app.models.style_theme import StyleTheme


router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# ============================================================
# 1) 설문 기반 추천 (카테고리별 TOP 6)
# ============================================================
@router.post("/from-survey")
def recommend_from_survey(session_id: int, db: Session = Depends(get_db)):
    """
    session_style_result 기반 추천 API
    - rank_no 1 → 메인 스타일
    - 해당 style_id 가구를 category별 6개 추천(score DESC)
    """

    # 1) 최종 스타일 조회
    result = (
        db.query(SessionStyleResult)
        .filter_by(session_id=session_id, rank_no=1)
        .first()
    )
    if not result:
        raise HTTPException(404, detail="⚠ final-analysis가 먼저 필요합니다.")

    style_id = result.style_id

    # 2) style_id 기준 category만 추출
    categories = (
        db.query(FurnitureProduct.category)
        .filter(FurnitureProduct.style_id == style_id)
        .distinct()
        .all()
    )
    if not categories:
        return {
            "session_id": session_id,
            "style_id": style_id,
            "categories": {},
            "message": "⚠ 해당 스타일 추천 가구가 없습니다."
        }

    # 3) category 별 top 6
    category_results = {}
    for (category,) in categories:

        items = (
            db.query(FurnitureProduct)
            .filter(
                FurnitureProduct.style_id == style_id,
                FurnitureProduct.category == category
            )
            .order_by(
                FurnitureProduct.score.desc(),
                FurnitureProduct.created_at.desc()
            )
            .limit(6)
            .all()
        )

        if items:
            category_results[category] = [
                {
                    "product_id": p.product_id,
                    "name": p.name,
                    "image_url": p.image_url,
                    "detail_url": p.detail_url,
                    "category": p.category,
                    "lowest_price": int(p.lowest_price) if getattr(p, "lowest_price", None) else None,  # 🔥 가격 필드 반영
                    "score": float(p.score) if p.score else None
                }
                for p in items
            ]

    return {
        "session_id": session_id,
        "style_id": style_id,
        "categories": category_results
    }



# ============================================================
# 2) 테마 상세 정보 + 카테고리 목록
# ============================================================
@router.get("/themes/{themeId}")
def get_theme_detail(themeId: int, db: Session = Depends(get_db)):
    """
    테마 상세 화면 API
    - themeId → style_theme 조회
    - 해당 style 가구 카테고리 목록 반환
    """

    theme = db.query(StyleTheme).filter(StyleTheme.style_id == themeId).first()
    if not theme:
        raise HTTPException(404, detail="❗존재하지 않는 테마 ID")

    categories = (
        db.query(FurnitureProduct.category)
        .filter(FurnitureProduct.style_id == themeId)
        .distinct()
        .all()
    )
    category_list = [c[0] for c in categories] if categories else []

    return {
        "themeId": theme.style_id,
        "name": theme.style_name,
        "description": theme.description,
        "categories": category_list  # 🔥 이걸로 상세 조회화면 연결 가능
    }
# ============================================================
# 3) 특정 테마 + 카테고리 TOP 6 가구 조회
# ============================================================
@router.get("/themes/{themeId}/{category}")
def get_theme_category_items(themeId: int, category: str, db: Session = Depends(get_db)):
    """
    테마 상세 페이지에서 -> 카테고리 선택 시 호출
    6개씩 보여주며 score DESC 우선순위
    """

    # 1) 테마 유효성 체크
    theme = db.query(StyleTheme).filter(StyleTheme.style_id == themeId).first()
    if not theme:
        raise HTTPException(404, detail="❗존재하지 않는 테마 ID")

    # 2) 해당 테마 + 카테고리 상품 조회
    products = (
        db.query(FurnitureProduct)
        .filter(
            FurnitureProduct.style_id == themeId,
            FurnitureProduct.category == category
        )
        .order_by(
            FurnitureProduct.score.desc(),
            FurnitureProduct.created_at.desc()
        )
        .limit(6)
        .all()
    )

    if not products:
        return {
            "themeId": themeId,
            "category": category,
            "items": [],
            "message": "해당 카테고리에는 상품이 없습니다."
        }

    # 3) Response
    return {
        "themeId": themeId,
        "category": category,
        "count": len(products),
        "items": [
            {
                "product_id": p.product_id,
                "name": p.name,
                "image_url": p.image_url,
                "detail_url": p.detail_url,
                "lowest_price": int(p.lowest_price) if getattr(p, "lowest_price", None) else None,
                "score": float(p.score) if p.score else None,
            }
            for p in products
        ]
    }
