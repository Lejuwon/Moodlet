from pydantic import BaseModel
from typing import List, Dict, Optional


### ------------------------
###  공통 질문 스키마
### ------------------------
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


### ------------------------
### 설문 세션 생성
### ------------------------
class StartSessionRequest(BaseModel):
    user_id: Optional[int] = None


class StartSessionResponse(BaseModel):
    session_id: int
    questions: List[QuestionOut]


### ------------------------
### Follow-Up 질문
### ------------------------
class FollowupRequest(BaseModel):
    session_id: Optional[int] = None
    choiceAnswers: Dict[str, any]


class FollowupQuestionOut(BaseModel):
    id: str
    text: str


class FollowupResponse(BaseModel):
    session_id: Optional[int] = None
    questions: List[FollowupQuestionOut]


### ------------------------
### 최종 분석 API
### ------------------------
class SurveyFinalRequest(BaseModel):
    session_id: Optional[int] = None
    choiceAnswers: Dict[str, any]
    textAnswers: Dict[str, str]


class SurveyFinalResponse(BaseModel):
    session_id: Optional[int]
    finalStyle: str
    finalStyleLabel: str
    bestMatchStyles: List[str]
    bestMatchStyleLabels: List[str]
    worstStyle: Optional[str]
    worstStyleLabel: Optional[str]
    prompt: str
    image: Optional[str]
