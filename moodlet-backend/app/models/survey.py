from sqlalchemy import (
    Column, BigInteger, Text, Integer, Boolean, JSON, TIMESTAMP,
    ForeignKey, CheckConstraint, func, Numeric
)
from app.database import Base


class SurveyGlobalQuestion(Base):
    __tablename__ = "survey_global_question"

    gq_id = Column(BigInteger, primary_key=True)
    code = Column(Text, unique=True, nullable=False)
    type = Column(Text, nullable=False)
    order_no = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON)
    active = Column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint("type IN ('SINGLE','MULTI','SCALE','TEXT')"),
    )


class SurveySession(Base):
    __tablename__ = "survey_session"

    session_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"))
    started_at = Column(TIMESTAMP, server_default=func.now())
    completed_at = Column(TIMESTAMP)


class SessionQuestion(Base):
    __tablename__ = "session_question"

    qinst_id = Column(BigInteger, primary_key=True)
    session_id = Column(BigInteger, ForeignKey("survey_session.session_id", ondelete="CASCADE"), nullable=False)
    source = Column(Text, nullable=False)  # GLOBAL or AI
    code = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
    order_no = Column(Integer)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON)
    meta_json = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("source IN ('GLOBAL','AI')"),
    )


class SessionAnswer(Base):
    __tablename__ = "session_answer"

    session_id = Column(BigInteger, ForeignKey("survey_session.session_id", ondelete="CASCADE"), primary_key=True)
    qinst_id = Column(BigInteger, ForeignKey("session_question.qinst_id", ondelete="CASCADE"), primary_key=True)
    answer_json = Column(JSON, nullable=False)
    answered_at = Column(TIMESTAMP, server_default=func.now())


class SessionStyleResult(Base):
    __tablename__ = "session_style_result"

    result_id = Column(BigInteger, primary_key=True)
    session_id = Column(BigInteger, ForeignKey("survey_session.session_id", ondelete="CASCADE"), nullable=False)
    style_id = Column(BigInteger, ForeignKey("style_theme.style_id"), nullable=False)
    score = Column(Numeric(10,3), nullable=False)
    rank_no = Column(Integer, nullable=False)