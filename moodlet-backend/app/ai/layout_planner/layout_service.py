# import base64
# import json
# from openai import OpenAI
# import os
# from app.models.furniture import FurnitureProduct
# from app.models.floorplan import Floorplan

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# def run_ai_layout(fp_id, furniture_ids, db):
#     # 1) 평면도 가져오기
#     fp = db.query(Floorplan).filter(Floorplan.fp_id == fp_id).first()
#     meta = fp.meta_json               # YOLO/GPT floorplan 분석 결과
#     image_path = fp.image_url.replace("/static/", "uploads/")

#     # 2) 평면도 이미지 base64로 로드
#     with open(image_path, "rb") as f:
#         img_b64 = base64.b64encode(f.read()).decode()

#     # 3) 가구 정보 로드
#     furniture_data = []
#     for fid in furniture_ids:
#         f = db.query(FurnitureProduct).filter(FurnitureProduct.product_id == fid).first()

#         furniture_data.append({
#             "furniture_id": fid,
#             "name": f.name,
#             "width_cm": f.width_cm or 100,
#             "depth_cm": f.depth_cm or 50,
#             "category": f.category,
#         })

#     # 4) GPT 요청 생성
#     prompt = f"""
# You are an interior layout engine.
# Using the room geometry and objects, compute optimal placement.

# Room geometry:
# {json.dumps(meta, indent=2)}

# Furniture to place:
# {json.dumps(furniture_data, indent=2)}

# Rules:
# - Do not overlap with walls, doors, windows.
# - Maintain realistic spacing.
# - Prefer natural placement (desk near window, bed against wall, etc.)
# - Output JSON only with the following keys:
#   furniture_id, position{x,y}, rotation, size(width,depth), confidence.
# """

#     response = client.chat.completions.create(
#         model="gpt-4o",
#         messages=[
#             {
#                 "role": "user",
#                 "content": [
#                     {"type": "text", "text": prompt},
#                     {
#                         "type": "image_url",
#                         "image_url": f"data:image/png;base64,{img_b64}"
#                     }
#                 ]
#             }
#         ]
#     )

#     try:
#         result = json.loads(response.choices[0].message["content"])
#     except Exception as e:
#         print("❌ GPT JSON 파싱 실패:", e)
#         return []

#     return result["furniture"]
