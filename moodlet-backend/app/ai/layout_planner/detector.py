import base64
import json
import os
import re
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_json(text: str):
    """GPT가 텍스트를 섞어서 보내도 JSON 부분만 추출"""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        return json.loads(match.group())
    except:
        return {}


def analyze_floorplan_with_gpt(image_path: str):
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    prompt = """
    다음 평면도 이미지를 분석해서 구조 정보를 JSON ONLY 로 반환해.
    설명 없이 JSON만 출력해.

    필요한 필드:
    {
      "walls": [{"x1":0,"y1":0,"x2":0,"y2":0}],
      "doors": [{"x":0,"y":0,"width_cm":80}],
      "windows": [{"x":0,"y":0,"width_cm":120}],
      "rooms": [{"type":"kitchen","polygon":[[x,y], ...]}],
      "built_in": [{"type":"closet","polygon":[[x,y], ...]}]
    }
    """

    response = client.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/png;base64,{img_b64}",
                    }
                ]
            }
        ]
    )

    text = response.output_text

    print("\n=========== GPT RAW OUTPUT ===========\n", text)

    return extract_json(text)
