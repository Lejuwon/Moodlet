# app/routes/survey_routes.py

from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db

from app.services.ai_client import (
    generate_followup_questions,
    analyze_final_style,
    generate_image,
)

from app.models.style_types import STYLE_LABELS  # 코드 → 한글 라벨
from app.services.style_mapping import STYLE_MAP   # style_code → style_id 매핑
from app.services.survey_logic import pick_final_style

from app.models.survey import (
    SurveyGlobalQuestion,
    SurveySession,
    SessionQuestion,
    SessionAnswer,
    SessionStyleResult,
)

from app.models.style_theme import StyleTheme


router = APIRouter(prefix="/survey", tags=["Survey"])


# ---------------------------------------------------------
# 🔹 Pydantic Schemas
# ---------------------------------------------------------

class QuestionOption(BaseModel):
    value: str
    label: str


class QuestionOut(BaseModel):
    code: str
    question: str
    type: str
    options: List[QuestionOption]


class SurveyFormOut(BaseModel):
    code: str
    questions: List[QuestionOut]


class StartSessionRequest(BaseModel):
    user_id: Optional[int] = None
    form_code: Optional[str] = "default"


class StartSessionResponse(BaseModel):
    session_id: int
    questions: List[QuestionOut]


class FollowupQuestionOut(BaseModel):
    id: str
    text: str


class FollowupRequest(BaseModel):
    session_id: Optional[int] = None
    choiceAnswers: Dict[str, Any]


class FollowupResponse(BaseModel):
    session_id: Optional[int] = None
    questions: List[FollowupQuestionOut]


class AnswerItem(BaseModel):
    qinst_id: int
    answer: Any


class SaveAnswersRequest(BaseModel):
    session_id: int
    answers: List[AnswerItem]


class SurveyFinalRequest(BaseModel):
    session_id: Optional[int] = None
    choiceAnswers: Dict[str, Any]
    textAnswers: Dict[str, str]


class SurveyFinalResponse(BaseModel):
    session_id: Optional[int] = None
    finalStyle: str
    finalStyleLabel: str
    bestMatchStyles: List[str]
    bestMatchStyleLabels: List[str]
    worstStyle: Optional[str] = None
    worstStyleLabel: Optional[str] = None
    prompt: str
    image: Optional[str] = None


# ---------------------------------------------------------
# 🔹 내부 공통 유틸
# ---------------------------------------------------------

def _to_question_out(row: SurveyGlobalQuestion) -> QuestionOut:
    options_raw = row.options_json or []
    options = [
        QuestionOption(value=str(opt.get("value")), label=str(opt.get("label")))
        for opt in options_raw
    ]
    return QuestionOut(
        code=row.code,
        question=row.question_text,
        type=row.type,
        options=options,
    )


# ---------------------------------------------------------
# 1) 설문 폼 조회 GET /survey/forms/{code}
# ---------------------------------------------------------

@router.get("/forms/{code}", response_model=SurveyFormOut)
def get_survey_form(code: str, db: Session = Depends(get_db)):
    rows = (
        db.query(SurveyGlobalQuestion)
        .filter(SurveyGlobalQuestion.active.is_(True))
        .order_by(SurveyGlobalQuestion.order_no.asc())
        .all()
    )
    return SurveyFormOut(
        code=code,
        questions=[_to_question_out(r) for r in rows],
    )


@router.get("/global-questions", response_model=SurveyFormOut)
def get_global_questions(db: Session = Depends(get_db)):
    rows = (
        db.query(SurveyGlobalQuestion)
        .filter(SurveyGlobalQuestion.active.is_(True))
        .order_by(SurveyGlobalQuestion.order_no.asc())
        .all()
    )
    return SurveyFormOut(
        code="default",
        questions=[_to_question_out(r) for r in rows],
    )


# ---------------------------------------------------------
# 2) 설문 세션 생성
# ---------------------------------------------------------

@router.post("/sessions", response_model=StartSessionResponse)
def start_survey_session(payload: StartSessionRequest, db: Session = Depends(get_db)):
    session = SurveySession(user_id=payload.user_id)
    db.add(session)
    db.commit()
    db.refresh(session)

    rows = (
        db.query(SurveyGlobalQuestion)
        .filter(SurveyGlobalQuestion.active.is_(True))
        .order_by(SurveyGlobalQuestion.order_no.asc())
        .all()
    )

    for r in rows:
        sq = SessionQuestion(
            session_id=session.session_id,
            source="GLOBAL",
            code=r.code,
            type=r.type,
            order_no=r.order_no,
            question_text=r.question_text,
            options_json=r.options_json,
        )
        db.add(sq)

    db.commit()

    return StartSessionResponse(
        session_id=session.session_id,
        questions=[_to_question_out(r) for r in rows],
    )


# ---------------------------------------------------------
# 3) 답변 저장
# ---------------------------------------------------------

@router.post("/sessions/{session_id}/answers")
def save_session_answers(
    session_id: int, payload: SaveAnswersRequest, db: Session = Depends(get_db)
):
    if payload.session_id != session_id:
        raise HTTPException(400, "session_id mismatch")

    session = db.query(SurveySession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    for item in payload.answers:
        existing = (
            db.query(SessionAnswer)
            .filter(
                SessionAnswer.session_id == session_id,
                SessionAnswer.qinst_id == item.qinst_id,
            )
            .first()
        )
        if existing:
            existing.answer_json = item.answer
        else:
            db.add(
                SessionAnswer(
                    session_id=session_id,
                    qinst_id=item.qinst_id,
                    answer_json=item.answer,
                )
            )
    db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------
# 4) Follow-up 생성 (AI)
# ---------------------------------------------------------

@router.post("/followup", response_model=FollowupResponse)
async def followup_questions(payload: FollowupRequest, db: Session = Depends(get_db)):
    ai_questions = await generate_followup_questions(payload.choiceAnswers)
    out = [FollowupQuestionOut(id=q["id"], text=q["text"]) for q in ai_questions]

    if payload.session_id:
        session = (
            db.query(SurveySession)
            .filter_by(session_id=payload.session_id)
            .first()
        )
        if not session:
            raise HTTPException(404, "Session not found")

        for idx, q in enumerate(out, start=1):
            db.add(
                SessionQuestion(
                    session_id=session.session_id,
                    source="AI",
                    code=q.id,
                    type="TEXT",
                    order_no=100 + idx,
                    question_text=q.text,
                )
            )
        db.commit()

    return FollowupResponse(session_id=payload.session_id, questions=out)


# ---------------------------------------------------------
# 5) 최종 분석 (옵션 B 완성본)
# ---------------------------------------------------------

@router.post("/final-analysis", response_model=SurveyFinalResponse)
async def final_analysis(payload: SurveyFinalRequest, db: Session = Depends(get_db)):

    # 1) 규칙 기반 최종 스타일 계산 (⚡ AI가 아니라 survey_logic)
    final_style = pick_final_style(payload.choiceAnswers)

    # 2) AI는 bestMatch + worst + prompt만 작성
    analysis = await analyze_final_style(
        final_style,            # 이미 확정된 메인 스타일
        payload.textAnswers,    # 서술형 답변
    )

    best_styles = analysis.get("bestMatchStyles", []) or []
    worst_style = analysis.get("worstStyle")
    prompt = analysis.get("prompt", "")

    # 3) 라벨 변환
    final_label = STYLE_LABELS.get(final_style, final_style)
    best_labels = [STYLE_LABELS.get(s, s) for s in best_styles]
    worst_label = STYLE_LABELS.get(worst_style, worst_style) if worst_style else None

    # 4) 이미지 생성
    image_url = None
    try:
        image_url = await generate_image(prompt)
    except Exception as e:
        print(f"[WARN] 이미지 생성 실패: {e}")

    # 5) DB 저장
    if payload.session_id:
        db.query(SessionStyleResult).filter_by(
            session_id=payload.session_id
        ).delete()

        final_style_id = STYLE_MAP.get(final_style)
        rank = 1

        if final_style_id:
            db.add(
                SessionStyleResult(
                    session_id=payload.session_id,
                    style_id=final_style_id,
                    score=1.0,
                    rank_no=rank,
                )
            )
            rank += 1

        for s in best_styles:
            sid = STYLE_MAP.get(s)
            if sid and sid != final_style_id:
                db.add(
                    SessionStyleResult(
                        session_id=payload.session_id,
                        style_id=sid,
                        score=0.8,
                        rank_no=rank,
                    )
                )
                rank += 1

        db.commit()

    # 6) 응답 반환
    return SurveyFinalResponse(
        session_id=payload.session_id,
        finalStyle=final_style,
        finalStyleLabel=final_label,
        bestMatchStyles=best_styles,
        bestMatchStyleLabels=best_labels,
        worstStyle=worst_style,
        worstStyleLabel=worst_label,
        prompt=prompt,
        image=image_url,
    )
