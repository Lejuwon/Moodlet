from sqlalchemy import Column, BigInteger, Text, TIMESTAMP, func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, index=True)
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    image_url = Column(Text)
    oauth_provider = Column(Text, nullable=False)
    oauth_subject = Column(Text, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())