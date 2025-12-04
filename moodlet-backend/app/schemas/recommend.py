from pydantic import BaseModel
from typing import List, Dict, Optional


### -----------------------------------------
### 설문 기반 추천 결과
### POST /recommendations/from-survey
### -----------------------------------------
class RecommendedFurniture(BaseModel):
    product_id: int
    name: str
    image_url: Optional[str]
    detail_url: Optional[str]
    category: str
    lowest_price: Optional[int]
    score: Optional[float]


class RecommendationResponse(BaseModel):
    session_id: int
    style_id: int
    categories: Dict[str, List[RecommendedFurniture]]


### -----------------------------------------
### 테마 상세 조회
### GET /recommendations/themes/{themeId}
### -----------------------------------------
class ThemeDetail(BaseModel):
    themeId: int
    name: str
    description: Optional[str]
    categories: List[str]
