import json
from openai import OpenAI
import os
from app.models.floorplan import FloorplanObject
from app.models.furniture import FurnitureProduct

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
너는 고급 인테리어 가구 배치 전문가 AI이다.
입력으로 평면도 구조(벽/창문/문/방), 가구 크기, 방 타입이 주어진다.
출력은 '각 가구의 좌표·회전·배치 이유'를 포함한 JSON이다.

규칙:
- 가구는 벽에 겹치면 안 된다.
- 문/창문 앞은 비워둔다.
- 침대는 창문을 피하고 벽을 등지게 배치.
- 책상은 콘센트가 있을 법한 벽 근처.
- 옷장은 방 모서리에 가깝게.
- 좌표 단위는 픽셀(px).
"""

def run_gpt_layout(db, fp_id: int, furniture_ids: list):
    # 1) floorplan 구조 가져오기
    objects = db.query(FloorplanObject).filter(FloorplanObject.fp_id == fp_id).all()

    fp_struct = {
        "walls": [],
        "doors": [],
        "windows": [],
        "rooms": []
    }

    for o in objects:
        t = o.type
        if t == "wall":
            fp_struct["walls"].append(o.position_json)
        elif t == "door":
            fp_struct["doors"].append(o.position_json)
        elif t == "window":
            fp_struct["windows"].append(o.position_json)
        elif t == "room":
            fp_struct["rooms"].append(o.position_json)

    # 2) 가구 정보 가져오기
    furniture_data = []
    for fid in furniture_ids:
        f = db.query(FurnitureProduct).filter(FurnitureProduct.product_id == fid).first()
        furniture_data.append({
            "id": fid,
            "name": f.product_name,
            "width": f.width_cm,
            "depth": f.depth_cm,
            "category": f.category,
        })

    # 3) GPT에 프롬프트 구성
    prompt = f"""
    평면도 구조:
    {json.dumps(fp_struct, ensure_ascii=False)}

    배치할 가구 목록:
    {json.dumps(furniture_data, ensure_ascii=False)}

    아래 형식으로 출력해라:

    [
      {{
        "furniture_id": 1,
        "position": {{"x":100, "y":120}},
        "size": {{"w":120, "h":60}},
        "rotation": 0,
        "confidence": 0.95,
        "z_index": 1
      }}
    ]
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )

    txt = response.choices[0].message["content"]
    return json.loads(txt)

def generate_preview_image(floorplan_url: str, items: list):
    """
    floorplan + 배치된 가구를 시각적으로 그려주는 이미지 생성
    """

    prompt = f"""
    다음 평면도 위에 주어진 가구들을 배치한 모습을 하나의 이미지로 그려줘.

    평면도 URL:
    {floorplan_url}

    가구 목록:
    {items}

    '배치된 인테리어 프리뷰 이미지' 형태로 자연스럽게 렌더링해줘.
    """

    resp = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024"
    )

    img_b64 = resp.data[0].b64_json
    return "data:image/png;base64," + img_b64

