from sqlalchemy import Column, BigInteger, Text, JSON, TIMESTAMP, ForeignKey, func
from app.database import Base

class ImageCompositionRequest(Base):
    __tablename__ = "image_composition_request"

    request_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"))
    background_image_url = Column(Text, nullable=False)
    object_image_url = Column(Text, nullable=False)
    position_json = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ImageCompositionResult(Base):
    __tablename__ = "image_composition_result"

    result_id = Column(BigInteger, primary_key=True)
    request_id = Column(BigInteger, ForeignKey(
        "image_composition_request.request_id",
        ondelete="CASCADE"
    ))
    result_image_url = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
