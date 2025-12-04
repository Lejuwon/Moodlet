from pydantic import BaseModel
from typing import List


class LayoutRunRequest(BaseModel):
    fp_id: int
    categories: List[str]