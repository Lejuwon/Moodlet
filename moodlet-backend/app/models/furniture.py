from sqlalchemy import (
    Column, BigInteger, Text, Numeric, TIMESTAMP, ForeignKey, JSON, func
)
from app.database import Base


class FurnitureProduct(Base):
    __tablename__ = "furniture_product"

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    detail_url = Column(Text)
    image_url = Column(Text)
    category = Column(Text)

    width = Column(Numeric(10, 2))
    depth = Column(Numeric(10, 2))
    height = Column(Numeric(10, 2))

    bed_size_code = Column(Text)
    material = Column(Text)
    color = Column(Text)

    style_id = Column(BigInteger, ForeignKey("style_theme.style_id"))
    score = Column(Numeric(10, 4))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # 가격 정보
    lowest_price = Column(BigInteger)
    highest_price = Column(BigInteger)


class FurniturePrice(Base):
    __tablename__ = "furniture_price"

    price_id = Column(BigInteger, primary_key=True)
    product_id = Column(BigInteger, ForeignKey(
        "furniture_product.product_id",
        ondelete="CASCADE"
    ))
    mall_name = Column(Text)
    mall_price = Column(Text)
    ship_fee = Column(Text)
    mall_url = Column(Text)


class FurnitureEmbedding(Base):
    __tablename__ = "furniture_embedding"

    product_id = Column(BigInteger, ForeignKey(
        "furniture_product.product_id",
        ondelete="CASCADE"
    ), primary_key=True)

    embedding = Column(Text)  # 실제 pgvector는 DDL에서 VECTOR(512) 선언됨
