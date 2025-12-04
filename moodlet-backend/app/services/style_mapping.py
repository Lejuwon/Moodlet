# app/services/style_mapping.py

"""
AI가 반환하는 스타일 코드(예: MINIMAL_MODERN, SCANDI ...)를
style_theme 테이블의 style_id(1~8)로 매핑하기 위한 룰 모음.
"""

STYLE_MAP = {
    # 1. 미니멀 & 모던
    "MINIMAL": 1,
    "MINIMAL_MODERN": 1,
    "MODERN": 1,
    "SIMPLE": 1,
    "CLEAN": 1,

    # 2. 북유럽 (스칸디나비안)
    "NORDIC": 2,
    "SCANDI": 2,
    "SCANDINAVIAN": 2,

    # 3. 내추럴 & 우드
    "NATURAL": 3,
    "WOOD": 3,
    "NATURAL_WOOD": 3,
    "WARM_WOOD": 3,

    # 4. 빈티지 & 앤티크
    "VINTAGE": 4,
    "ANTIQUE": 4,
    "CLASSIC_VINTAGE": 4,

    # 5. 파스텔
    "PASTEL": 5,
    "SOFT_TONE": 5,
    "LIGHT_COLOR": 5,

    # 6. 인더스트리얼
    "INDUSTRIAL": 6,
    "IRON_METAL": 6,
    "FACTORY_STYLE": 6,

    # 7. 미드센추리
    "MIDCENTURY": 7,
    "RETRO": 7,
    "MIDCENTURY_MODERN": 7,

    # 8. 플랜테리어
    "PLANT": 8,
    "BOTANIC": 8,
    "GREEN_INTERIOR": 8,
}
