from sqlalchemy import Column, BigInteger, Text, JSON, TIMESTAMP, ForeignKey, Numeric, Integer, CheckConstraint, func
from app.database import Base


class Floorplan(Base):
    __tablename__ = "floorplan"

    fp_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"))
    image_url = Column(Text, nullable=False)
    meta_json = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class FloorplanObject(Base):
    __tablename__ = "floorplan_object"

    obj_id = Column(BigInteger, primary_key=True)
    fp_id = Column(BigInteger, ForeignKey("floorplan.fp_id", ondelete="CASCADE"))
    type = Column(Text, nullable=False)  # DOOR, WINDOW, WALL
    position_json = Column(JSON, nullable=False)
    meta_json = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class LayoutSession(Base):
    __tablename__ = "layout_session"

    layout_id = Column(BigInteger, primary_key=True)
    fp_id = Column(BigInteger, ForeignKey("floorplan.fp_id", ondelete="CASCADE"))
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"))
    status = Column(Text, nullable=False)
    model_used = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    completed_at = Column(TIMESTAMP)

    __table_args__ = (
        CheckConstraint("status IN ('PENDING','PROCESSING','SUCCESS','FAILED')"),
    )


class LayoutFurnitureItem(Base):
    __tablename__ = "layout_furniture_item"

    lf_id = Column(BigInteger, primary_key=True)
    layout_id = Column(BigInteger, ForeignKey("layout_session.layout_id", ondelete="CASCADE"))
    furniture_id = Column(BigInteger, ForeignKey("furniture_product.product_id"))
    position_json = Column(JSON, nullable=False)
    size_json = Column(JSON)
    rotation_deg = Column(Numeric(10,2), default=0)
    confidence = Column(Numeric(10,4))
    z_index = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class LayoutHistory(Base):
    __tablename__ = "layout_history"

    hist_id = Column(BigInteger, primary_key=True)
    lf_id = Column(BigInteger, ForeignKey("layout_furniture_item.lf_id", ondelete="CASCADE"))
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"))
    action_type = Column(Text, nullable=False)
    before_json = Column(JSON)
    after_json = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("action_type IN ('MOVE','RESIZE','ROTATE','DELETE','ADD')"),
    )
