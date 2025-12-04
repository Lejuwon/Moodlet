# app/models/style_types.py

# ================================
# 📌 8개 인테리어 스타일 (최신 버전)
# ================================

STYLE_MINIMAL_MODERN = "MINIMAL_MODERN"         # (미니멀 + 모던)
STYLE_SCANDINAVIAN = "SCANDINAVIAN"             # (북유럽)
STYLE_NATURAL_WOOD = "NATURAL_WOOD"             # (내추럴 & 우드)
STYLE_VINTAGE_ANTIQUE = "VINTAGE_ANTIQUE"       # (빈티지 & 앤티크)
STYLE_PASTEL = "PASTEL"                         # (파스텔)
STYLE_INDUSTRIAL = "INDUSTRIAL"                 # (인더스트리얼)
STYLE_MIDCENTURY = "MIDCENTURY"                 # (미드센츄리)
STYLE_PLANTERIOR = "PLANTERIOR"                 # (플랜테리어)

ALL_STYLES = [
    STYLE_MINIMAL_MODERN,
    STYLE_SCANDINAVIAN,
    STYLE_NATURAL_WOOD,
    STYLE_VINTAGE_ANTIQUE,
    STYLE_PASTEL,
    STYLE_INDUSTRIAL,
    STYLE_MIDCENTURY,
    STYLE_PLANTERIOR,
]

# ================================
# 📌 한글 스타일 라벨
# ================================
STYLE_LABELS = {
    STYLE_MINIMAL_MODERN: "미니멀 & 모던",
    STYLE_SCANDINAVIAN: "북유럽 (스칸디나비안)",
    STYLE_NATURAL_WOOD: "내추럴 & 우드",
    STYLE_VINTAGE_ANTIQUE: "빈티지 & 앤티크",
    STYLE_PASTEL: "파스텔",
    STYLE_INDUSTRIAL: "인더스트리얼",
    STYLE_MIDCENTURY: "미드센츄리",
    STYLE_PLANTERIOR: "플랜테리어",
}

# ================================
# 📌 BEST 조합 (궁합 좋은 스타일)
# ================================
STYLE_COMPAT = {
    STYLE_MINIMAL_MODERN: [STYLE_SCANDINAVIAN, STYLE_NATURAL_WOOD],
    STYLE_SCANDINAVIAN: [STYLE_MINIMAL_MODERN, STYLE_NATURAL_WOOD],
    STYLE_NATURAL_WOOD: [STYLE_SCANDINAVIAN, STYLE_PLANTERIOR],
    STYLE_VINTAGE_ANTIQUE: [STYLE_MIDCENTURY, STYLE_INDUSTRIAL],
    STYLE_PASTEL: [STYLE_SCANDINAVIAN, STYLE_PLANTERIOR],
    STYLE_INDUSTRIAL: [STYLE_MINIMAL_MODERN, STYLE_VINTAGE_ANTIQUE],
    STYLE_MIDCENTURY: [STYLE_VINTAGE_ANTIQUE, STYLE_SCANDINAVIAN],
    STYLE_PLANTERIOR: [STYLE_NATURAL_WOOD, STYLE_PASTEL],
}

# ================================
# 📌 WORST 조합 (안 맞는 스타일)
# ================================
STYLE_OPPOSITE = {
    STYLE_MINIMAL_MODERN: STYLE_VINTAGE_ANTIQUE,
    STYLE_SCANDINAVIAN: STYLE_INDUSTRIAL,
    STYLE_NATURAL_WOOD: STYLE_INDUSTRIAL,
    STYLE_VINTAGE_ANTIQUE: STYLE_MINIMAL_MODERN,
    STYLE_PASTEL: STYLE_INDUSTRIAL,
    STYLE_INDUSTRIAL: STYLE_PASTEL,
    STYLE_MIDCENTURY: STYLE_MINIMAL_MODERN,
    STYLE_PLANTERIOR: STYLE_INDUSTRIAL,
}

# ================================
# 📌 이미지 생성용 디테일 조각
# ================================
STYLE_DETAILED_INFO = {
    "MINIMAL_MODERN": {
        "roomMood": "clean, refined, uncluttered modern home",
        "colors": "white, gray, black, subtle neutrals",
        "materials": "matte surfaces, metal, glass, engineered wood",
        "lighting": "soft indirect lighting, LED lines, natural light",
        "furniture": "sleek geometric furniture with simple forms",
        "decor": "minimal art, one statement piece, functional decor",
        "composition": "open layout, high balance, clean symmetry"
    },
    "SCANDINAVIAN": {
        "roomMood": "warm, bright, inviting nordic home",
        "colors": "white, beige, light oak, soft pastel tones",
        "materials": "linen, cotton, natural wood",
        "lighting": "soft warm ambient lights",
        "furniture": "light wood furniture with soft edges",
        "decor": "plants, woven baskets, cozy accents",
        "composition": "airy structure with gentle curves"
    },
    "NATURAL_WOOD": {
        "roomMood": "earthy, warm, peaceful nature-inspired space",
        "colors": "brown, beige, oak, muted earthy palette",
        "materials": "wood, rattan, linen fabric",
        "lighting": "warm soft daylight",
        "furniture": "solid wood with soft round shapes",
        "decor": "pottery, plants, natural decor",
        "composition": "organic arrangement with warm tones"
    },
    "VINTAGE_ANTIQUE": {
        "roomMood": "retro, nostalgic, antique atmosphere",
        "colors": "deep brown, navy, mustard, antique gold",
        "materials": "leather, brass, vintage wood",
        "lighting": "warm vintage bulbs and classic lamps",
        "furniture": "antique chairs, retro cabinets",
        "decor": "classic posters, vinyl, retro ornaments",
        "composition": "rich layering and nostalgic balance"
    },
    "PASTEL": {
        "roomMood": "soft, dreamy, gentle pastel interior",
        "colors": "pink, lavender, mint, baby blue",
        "materials": "soft fabrics and smooth surfaces",
        "lighting": "soft ambient glow",
        "furniture": "round cozy furniture",
        "decor": "cute posters, minimal aesthetic props",
        "composition": "gentle gradients and rounded shapes"
    },
    "INDUSTRIAL": {
        "roomMood": "raw, urban, loft industrial style",
        "colors": "black, gray, brick red",
        "materials": "concrete, brick, steel pipes",
        "lighting": "warm tungsten industrial lights",
        "furniture": "leather sofa, metal furniture",
        "decor": "industrial frames, vintage posters",
        "composition": "loft open plan with textured surfaces"
    },
    "MIDCENTURY": {
        "roomMood": "classic 1950s retro elegance",
        "colors": "walnut, orange, olive green",
        "materials": "walnut wood, velvet, brass",
        "lighting": "chrome lamps, warm lighting",
        "furniture": "curved midcentury furniture",
        "decor": "retro clocks, geometric patterns",
        "composition": "bold shapes and stylish layout"
    },
    "PLANTERIOR": {
        "roomMood": "fresh, green, plant-filled interior",
        "colors": "green, beige, natural wood",
        "materials": "terracotta, plant textures",
        "lighting": "bright daylight",
        "furniture": "light wood furniture",
        "decor": "various plants and greenery",
        "composition": "balanced plant placement"
    },
}
