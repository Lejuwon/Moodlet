# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db          # ← 네 프로젝트 구조에 맞게
from app.models.user import User         # ← user 모델

# 브라우저에서 보낼 토큰 위치 정의 (Authorization: Bearer XXXX)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # tokenUrl은 안 써도 되지만 필수 파라미터라 대충 둠


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=2))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Authorization 헤더로 들어온 JWT를 검증하고
    해당 유저 객체를 반환하는 의존성
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 토큰 디코드
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # DB에서 유저 조회 (PK 이름이 user_id인 구조 기준)
    user = db.query(User).filter(User.user_id == int(sub)).first()
    if user is None:
        raise credentials_exception

    return user
