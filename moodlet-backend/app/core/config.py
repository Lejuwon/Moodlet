# app/core/config.py (또는 너가 실제로 쓰는 config.py)
# import os
# from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# load_dotenv()

# class Settings:
#     DB_URL: str = os.getenv("DATABASE_URL")
#     OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

class Settings(BaseSettings):
    # 🔹 Database
    DB_URL: str | None = None

    # 🔹 OpenAI
    OPENAI_API_KEY: str  # ★ 이거 반드시 필요
    
    # 🔹 Google OAuth 설정
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    # 🔹 프론트엔드 / JWT 설정
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # 🔹 pydantic-settings v2 설정
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ⬅ 정의 안 된 환경변수는 무시 (지금 에러 막아주는 부분)
    )


settings = Settings()
