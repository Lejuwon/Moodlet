from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        image_url=user_in.image_url,            # None 가능
        oauth_provider=user_in.oauth_provider,  # NOT NULL
        oauth_subject=user_in.oauth_subject,    # NOT NULL 이면 여기서 채워줌
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user