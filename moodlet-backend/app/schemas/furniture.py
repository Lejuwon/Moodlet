from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FurnitureProductSimpleResponse(BaseModel):
    product_id: int
    name: str
    image_url: Optional[str] = None
    detail_url: Optional[str] = None
    category: Optional[str] = None

    lowest_price: Optional[int] = None
    highest_price: Optional[int] = None

    class Config:
        orm_mode = True
        
class ShoppingMallPrice(BaseModel):
    mall_name: Optional[str] = None
    mall_price: Optional[str] = None
    ship_fee: Optional[str] = None
    mall_url: Optional[str] = None

    class Config:
        orm_mode = True
        
class FurnitureProductDetailResponse(BaseModel):
    product_id: int
    name: str
    image_url: Optional[str]
    detail_url: Optional[str]
    category: Optional[str]

    width: Optional[float]
    depth: Optional[float]
    height: Optional[float]

    bed_size_code: Optional[str]
    material: Optional[str]
    color: Optional[str]

    lowest_price: Optional[int]
    highest_price: Optional[int]

    prices: list[ShoppingMallPrice] = []

    class Config:
        orm_mode = True