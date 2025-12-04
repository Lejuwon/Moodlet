from sqlalchemy import Column, BigInteger, Text
from app.database import Base

class StyleTheme(Base):
    __tablename__ = "style_theme"

    style_id = Column(BigInteger, primary_key=True)
    style_name = Column(Text, unique=True, nullable=False)
    description = Column(Text)