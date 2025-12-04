from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.furniture_service import get_furniture, get_furniture_detail
from app.schemas.furniture import FurnitureProductSimpleResponse, FurnitureProductDetailResponse

router = APIRouter(prefix="/furniture", tags=["Furniture"])

@router.get("/", response_model=list[FurnitureProductSimpleResponse])
def fetch_furniture(main: str, sub: str | None = None, db: Session = Depends(get_db)):
    return get_furniture(db, main, sub)

@router.get("/{product_id}", response_model=FurnitureProductDetailResponse)
def fetch_detail(product_id: int, db: Session = Depends(get_db)):
    result = get_furniture_detail(db, product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result