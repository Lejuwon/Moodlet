# app/services/survey_logic.py

from typing import Dict, Literal
from app.models.style_types import (
    STYLE_MINIMAL_MODERN,
    STYLE_SCANDINAVIAN,
    STYLE_NATURAL_WOOD,
    STYLE_VINTAGE_ANTIQUE,
    STYLE_PASTEL,
    STYLE_INDUSTRIAL,
    STYLE_MIDCENTURY,
    STYLE_PLANTERIOR,
)

ChoiceOption = Literal["A", "B", "C"]


# =======================================================
# 🔥 1) 그룹(A/B/C) 결정 — 질문 7개 전체 기반
# =======================================================

GROUP_MAP = {
    "Q1": {"A": "A", "B": "B", "C": "C"},
    "Q2": {"A": "A", "B": "B", "C": "C"},
    "Q3": {"A": "A", "B": "B", "C": "C"},
    "Q4": {"A": "A", "B": "B", "C": "C"},
    "Q5": {"A": "A", "B": "B", "C": "C"},
    "Q6": {"A": "A", "B": "B", "C": "C"},
    "Q7": {"A": "A", "B": "B", "C": "C"},
}


def pick_group(choice_answers: Dict[str, ChoiceOption]) -> str:
    """7개 문항으로 A/B/C 중 하나 선택"""
    scores = {"A": 0, "B": 0, "C": 0}

    for qid, opt in choice_answers.items():
        if qid in GROUP_MAP:
            group = GROUP_MAP[qid][opt]
            scores[group] += 1

    return max(scores, key=lambda g: scores[g])


# =======================================================
# 🔥 2) 그룹 내부에서 최종 스타일 선택
# =======================================================

# -------------------------------
# A 그룹 → 미니멀·모던·인더스트리얼
# -------------------------------
def pick_style_in_group_a(choice_answers: Dict[str, ChoiceOption]) -> str:
    scores = {
        STYLE_MINIMAL_MODERN: 0,
        STYLE_INDUSTRIAL: 0,
    }

    q3 = choice_answers.get("Q3")
    q4 = choice_answers.get("Q4")
    q5 = choice_answers.get("Q5")
    q6 = choice_answers.get("Q6")
    q7 = choice_answers.get("Q7")

    # 정리/깔끔함
    if q6 == "A":
        scores[STYLE_MINIMAL_MODERN] += 2
    if q6 == "C":
        scores[STYLE_INDUSTRIAL] += 2

    # 색
    if q3 == "A":
        scores[STYLE_MINIMAL_MODERN] += 1
    if q3 == "C":
        scores[STYLE_INDUSTRIAL] += 2

    # 재질
    if q4 == "A":
        scores[STYLE_INDUSTRIAL] += 1
    if q4 == "B":
        scores[STYLE_MINIMAL_MODERN] += 1

    # 소품
    if q5 == "A":
        scores[STYLE_MINIMAL_MODERN] += 1
    if q5 == "C":
        scores[STYLE_INDUSTRIAL] += 1

    # 조명
    if q7 == "A":
        scores[STYLE_MINIMAL_MODERN] += 2
    if q7 == "C":
        scores[STYLE_INDUSTRIAL] += 2

    return max(scores, key=lambda k: scores[k])


# -------------------------------
# B 그룹 → 북유럽·내추럴·플랜테리어
# -------------------------------
def pick_style_in_group_b(choice_answers: Dict[str, ChoiceOption]) -> str:
    scores = {
        STYLE_SCANDINAVIAN: 0,
        STYLE_NATURAL_WOOD: 0,
        STYLE_PLANTERIOR: 0,
    }

    q3 = choice_answers.get("Q3")
    q4 = choice_answers.get("Q4")
    q5 = choice_answers.get("Q5")
    q6 = choice_answers.get("Q6")
    q7 = choice_answers.get("Q7")

    # 색상 (자연스러움)
    if q3 == "B":
        scores[STYLE_NATURAL_WOOD] += 2
    if q3 == "A":
        scores[STYLE_SCANDINAVIAN] += 1
    if q3 == "C":
        scores[STYLE_PLANTERIOR] += 2

    # 재질
    if q4 == "B":
        scores[STYLE_NATURAL_WOOD] += 2
    if q4 == "C":
        scores[STYLE_PLANTERIOR] += 2

    # 소품
    if q5 == "B":
        scores[STYLE_NATURAL_WOOD] += 1
    if q5 == "C":
        scores[STYLE_PLANTERIOR] += 1

    # 정리 상태
    if q6 == "A":
        scores[STYLE_SCANDINAVIAN] += 1
    if q6 == "B":
        scores[STYLE_NATURAL_WOOD] += 1
    if q6 == "C":
        scores[STYLE_PLANTERIOR] += 2

    # 조명
    if q7 == "B":
        scores[STYLE_SCANDINAVIAN] += 1
        scores[STYLE_NATURAL_WOOD] += 1
    if q7 == "C":
        scores[STYLE_PLANTERIOR] += 2

    return max(scores, key=lambda k: scores[k])


# -------------------------------
# C 그룹 → 빈티지·미드센츄리·파스텔
# -------------------------------
def pick_style_in_group_c(choice_answers: Dict[str, ChoiceOption]) -> str:
    scores = {
        STYLE_VINTAGE_ANTIQUE: 0,
        STYLE_MIDCENTURY: 0,
        STYLE_PASTEL: 0,
    }

    q3 = choice_answers.get("Q3")
    q4 = choice_answers.get("Q4")
    q5 = choice_answers.get("Q5")
    q6 = choice_answers.get("Q6")
    q7 = choice_answers.get("Q7")

    # 색감
    if q3 == "C":
        scores[STYLE_PASTEL] += 2
    if q3 == "A":
        scores[STYLE_VINTAGE_ANTIQUE] += 1
    if q3 == "B":
        scores[STYLE_MIDCENTURY] += 1

    # 재질
    if q4 == "C":
        scores[STYLE_VINTAGE_ANTIQUE] += 1
        scores[STYLE_MIDCENTURY] += 1

    # 소품
    if q5 == "C":
        scores[STYLE_VINTAGE_ANTIQUE] += 2

    # 정리 상태
    if q6 == "C":
        scores[STYLE_PASTEL] += 1
        scores[STYLE_VINTAGE_ANTIQUE] += 1

    # 조명
    if q7 == "C":
        scores[STYLE_PASTEL] += 1
        scores[STYLE_VINTAGE_ANTIQUE] += 1

    return max(scores, key=lambda k: scores[k])


# =======================================================
# 🔥 3) 최종 스타일 선택
# =======================================================
def pick_final_style(choice_answers: Dict[str, ChoiceOption]) -> str:
    group = pick_group(choice_answers)

    if group == "A":
        return pick_style_in_group_a(choice_answers)
    if group == "B":
        return pick_style_in_group_b(choice_answers)
    return pick_style_in_group_c(choice_answers)
