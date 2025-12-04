from app.routes import user_routes, survey_routes, recommend_routes
from app.database import Base, engine   # ⬅ 여기 수정됨
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.routes.google_auth import router as google_auth_router
from app.routes.furniture_routes import router as furniture_router
from app.routes.floorplan_router import router as floorplan_router
from app.routes.layout_router import router as layout_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# 모델 import (테이블 생성 위해)
from app.models.user import User

app = FastAPI()

# ✅ CORS 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # 개발 중이면 ["*"] 도 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.JWT_SECRET,
)

# 개발 단계에서는 자동 테이블 생성
Base.metadata.create_all(bind=engine)

# 라우터 등록
app.include_router(user_routes.router)
app.include_router(google_auth_router)
app.include_router(furniture_router)
app.include_router(survey_routes.router)  # ⬅ 추가
app.include_router(recommend_routes.router)  # ⬅ 추가
app.include_router(floorplan_router, prefix="/api")
app.include_router(layout_router, prefix="/api")

# backend 절대경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

app.mount("/static", StaticFiles(directory="static"), name="static")