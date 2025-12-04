📘 Moodlet Backend Setup Guide (for Team Members)

이 문서는 Moodlet 백엔드 개발 환경을 빠르게 세팅하기 위한 가이드입니다.

🚀 1. 프로젝트 구조
backend/
│  main.py
│  config.py
│  database.py
│  requirements.txt
│
├─ app
│   ├─ models/
│   ├─ schemas/
│   ├─ routers/
│   ├─ services/
│   └─ core/
│
└─ alembic/

🛠 2. 필수 설치

Python 3.10+ (권장)

pip 최신 버전

가상환경(venv) 생성 가능해야 함

🔧 3. 가상환경 설치 & 실행
backend디렉토리에 설치하면 됨.

✔️ Windows
python -m venv venv
venv\Scripts\activate

✔️ macOS / Linux
python3 -m venv venv
source venv/bin/activate

📦 4. 패키지 설치
pip install -r requirements.txt

⚙️ 5. 환경변수 (.env) 설정

루트 경로에 .env 파일 생성:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

⚠️ .env는 Git에 올리지 않습니다.

🏗 6. 데이터베이스 마이그레이션 (Alembic 사용 시)

초기 생성

▶️ 7. 서버 실행 (FastAPI)
uvicorn main:app --reload


백엔드는 기본적으로 http://localhost:8000 에서 실행됩니다.

📁 8. 각 폴더 역할 설명
폴더	설명
models/	DB 테이블(SQLAlchemy ORM) 정의
schemas/	API 요청/응답 모델(Pydantic)
routers/	실제 API 엔드포인트 (라우팅)
services/	비즈니스 로직 처리
core/	인증/보안/공통 로직 (JWT, 해시 등)
alembic/	DB migration 관리 폴더
ai/style_recommendation/	설문 기반 인테리어 스타일 분석 및 추천 AI 로직
ai/image_composition/	인테리어 이미지 합성 로직
ai/floorplan_furniture/	평면도 분석 및 자동 가구 배치 AI 로직