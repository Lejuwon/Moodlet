from sqlalchemy.orm import Session
from app.models.furniture import FurnitureProduct,FurniturePrice

CATEGORY_MAPPING = {
    "bed": ["bed_frame", "mattress"],
    "sofa": ["sofa", "recliner"],
    "table": ["dining_table", "floor_table", "desk", "sofa_table"],
    "chair": ["chair", "stool", "bench", "floor_chair"],
    "storage": ["drawer", "storage_closet", "tv_stand", "shelf", "cabinet", "bookcase", "wardrobe", "hanger"],
    "fabric": ["duvet"],
    "decor": ["light", "plant", "mirror", "dresser"],
}


def get_furniture(db: Session, main: str, sub: str | None = None):
    """
    main = bed, sofa, table ...
    sub  = bed_frame, mattress, sofa_table ...
    """

    # 유효한 main 카테고리인지 체크
    if main not in CATEGORY_MAPPING:
        return []

    # 세부 카테고리로 필터링 (예: bed_frame만 조회)
    if sub:
        return (
            db.query(FurnitureProduct)
              .filter(FurnitureProduct.category == sub)
              .all()
        )

    # main-category에 해당하는 모든 sub-category 제품 조회
    return (
        db.query(FurnitureProduct)
          .filter(FurnitureProduct.category.in_(CATEGORY_MAPPING[main]))
          .all()
    )
    
def get_furniture_by_id(db: Session, product_id: int):
    return (
        db.query(FurnitureProduct)
          .filter(FurnitureProduct.product_id == product_id)
          .first()
    )
    
def get_furniture_detail(db: Session, product_id: int):
    product = (
        db.query(FurnitureProduct)
          .filter(FurnitureProduct.product_id == product_id)
          .first()
    )

    if not product:
        return None

    prices = (
        db.query(FurniturePrice)
          .filter(FurniturePrice.product_id == product_id)
          .all()
    )

    product.prices = prices
    return product