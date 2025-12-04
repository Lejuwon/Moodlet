# app/services/ai_client.py

from openai import OpenAI
from app.core.config import settings
import json
import re
import base64
import os
import uuid

# 스타일 타입 & 상세 프롬프트 조각
from app.models.style_types import (
    ALL_STYLES,
    STYLE_DETAILED_INFO,
)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


# --------------------------------------------------------
# 1) 개인화된 follow-up 질문 생성 (변경 없음)
# --------------------------------------------------------
async def generate_followup_questions(user_choice_answers: dict) -> list:
    prompt = f"""
너는 인테리어 취향 분석을 위한 follow-up 질문 생성 전문가다.

📌 사용자 선택형 답변(라벨만 중요):
{json.dumps(user_choice_answers, ensure_ascii=False)}

⚠ value('A/B/C')가 아닌 label 기반으로 질문 생성
❗ "A스타일", "B스타일" 같은 표현 금지

---

🎯 목표  
사용자의 취향을 더 명확하게 알 수 있도록  
서술형 질문 3개를 생성하라.

🔽 JSON만 반환:
[
  {{"id":"T1","text":"..."}},
  {{"id":"T2","text":"..."}},
  {{"id":"T3","text":"..."}}
]
"""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.5,
        messages=[
            {"role": "system", "content": "출력은 반드시 JSON 배열만 반환하세요."},
            {"role": "user", "content": prompt}
        ]
    )

    raw = resp.choices[0].message.content or ""

    try:
        data = json.loads(raw)
    except:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if not match:
            raise Exception(f"AI 응답에서 JSON 배열을 찾지 못했습니다: {raw}")
        data = json.loads(match.group(0))

    normalized = []
    for idx, item in enumerate(data, start=1):
        if isinstance(item, dict):
            normalized.append({
                "id": item.get("id") or f"T{idx}",
                "text": item.get("text") or ""
            })
        else:
            normalized.append({"id": f"T{idx}", "text": str(item)})

    return normalized


# --------------------------------------------------------
# 2) 최종 스타일 기반 Best/Worst + Prompt 생성 (옵션 B)
# --------------------------------------------------------
async def analyze_final_style(final_style: str, text_answers: dict) -> dict:
    """
    옵션 B:
    - finalStyle은 이미 survey_logic에서 계산된 상태로 전달됨
    - AI는:
        - bestMatchStyles 2~3개
        - worstStyle 1개
        - 영어 이미지 prompt 생성
    """

    if final_style not in ALL_STYLES:
        raise Exception(f"final_style이 ALL_STYLES에 속하지 않습니다: {final_style}")

    allowed_styles_str = ", ".join(f'"{s}"' for s in ALL_STYLES)

    prompt = f"""
너는 인테리어 스타일 전문가다.

📌 이미 확정된 최종 스타일:
finalStyle = "{final_style}"

📌 사용 가능한 모든 스타일(8개):
{allowed_styles_str}

📌 사용자의 서술형 답변(textAnswers):
{text_answers}

---

해야 할 일:
1) finalStyle과 조화로운 스타일 2~3개를 bestMatchStyles로 선택  
2) finalStyle과 가장 대비되는 스타일 1개(worstStyle) 선택  
3) 최종 이미지 생성을 위한 영어 프롬프트 생성
   - roomMood, colors, materials, lighting, furniture, decor, composition을 포함

출력(JSON만):
{{
  "bestMatchStyles": ["...", "..."],
  "worstStyle": "...",
  "prompt": "high quality interior render ..."
}}
"""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.25,
        messages=[
            {"role": "system", "content": "출력은 반드시 JSON만 반환하세요."},
            {"role": "user", "content": prompt},
        ]
    )

    raw = resp.choices[0].message.content or ""

    try:
        data = json.loads(raw)
    except:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise Exception(f"AI JSON 파싱 실패: {raw}")
        data = json.loads(match.group(0))

    # ----------------------------------------------------
    # 스타일 코드 유효성 필터링
    # ----------------------------------------------------
    best = [s for s in data.get("bestMatchStyles", []) if s in ALL_STYLES]
    worst = data.get("worstStyle")
    if worst not in ALL_STYLES:
        worst = None

    # ----------------------------------------------------
    # STYLE_DETAILED_INFO 기반 자동 prompt 강화
    # ----------------------------------------------------
    style_info = STYLE_DETAILED_INFO.get(final_style)
    if not style_info:
        raise Exception(f"STYLE_DETAILED_INFO 누락: {final_style}")

    auto_prompt = (
        f"{style_info['roomMood']}, "
        f"colors: {style_info['colors']}, "
        f"materials: {style_info['materials']}, "
        f"lighting: {style_info['lighting']}, "
        f"furniture: {style_info['furniture']}, "
        f"decor: {style_info['decor']}, "
        f"composition: {style_info['composition']}, "
        f"ultra high quality interior render, 4K, photorealistic"
    )

    # AI 생성 prompt가 있다면 보조적으로 포함해도 되고 무시해도 됨
    final_prompt = auto_prompt

    return {
        "finalStyle": final_style,
        "bestMatchStyles": best,
        "worstStyle": worst,
        "prompt": final_prompt
    }


# --------------------------------------------------------
# 3) 이미지 생성 (그대로 유지)
# --------------------------------------------------------
STATIC_DIR = "static/images"

async def generate_image(prompt: str) -> str:
    img = client.images.generate(
        model="gpt-image-1-mini",
        prompt=prompt,
        size="1024x1024"
    )

    b64 = img.data[0].b64_json
    img_bytes = base64.b64decode(b64)

    file_name = f"{uuid.uuid4().hex}.png"
    file_path = f"{STATIC_DIR}/{file_name}"

    os.makedirs(STATIC_DIR, exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(img_bytes)

    return f"/static/images/{file_name}"

