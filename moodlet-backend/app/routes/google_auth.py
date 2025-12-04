from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.requests import Request
from starlette.responses import RedirectResponse

from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import create_user
from app.core.security import create_access_token
from app.core.security import get_current_user

router = APIRouter(prefix="/auth/google", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/login")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI  # 예: "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"Google login error: {e.error}")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="No userinfo from Google")

    email = userinfo["email"]
    name = userinfo.get("name") or email.split("@")[0]
    sub = userinfo.get("sub")  # 구글 고유 사용자 ID (string)

    # picture = userinfo.get("picture")  # 이미지 안 쓸 거면 그냥 주석

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user_in = UserCreate(
            email=email,
            name=name,
            oauth_provider="google",  # 🔹 여기서 NOT NULL 채움
            oauth_subject=sub or "",  # 혹시라도 None이면 빈 문자열
            image_url=None,           # 또는 picture
        )
        user = create_user(db, user_in)

    access_token = create_access_token({"sub": str(user.user_id)})

    redirect_url = (
        f"{settings.FRONTEND_BASE_URL}"
        f"?token={access_token}&email={email}&name={name}"
    )
    return RedirectResponse(url=redirect_url)
