"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ThemeDetail = {
  themeId: number;
  name: string;
  description: string;
  categories: string[];
};

type ThemeItem = {
  product_id: number;
  name: string;
  image_url?: string | null;
  detail_url?: string | null;
  category: string;
  lowest_price?: number | null;
  score?: number | null;
};

// 카테고리 한글 라벨
const CATEGORY_LABEL: Record<string, string> = {
  bed_frame: "침대 프레임",
  sofa: "소파",
  rug: "러그",
  light: "조명",
  desk: "책상",
  chair: "의자",
  storage: "수납·정리",
};

const MAIN_CATEGORY_BY_SUB: Record<string, string> = {
  bed_frame: "bed",
  sofa: "sofa",
  rug: "fabric",
  light: "decor",
  desk: "table",
  chair: "chair",
  storage: "storage",
};

function formatPrice(price?: number | null) {
  if (price == null) return "-";
  return price.toLocaleString("ko-KR");
}

export default function ThemeFurniturePage() {
  const { themeId } = useParams<{ themeId: string }>();

  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [items, setItems] = useState<ThemeItem[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) 테마 상세 조회
  useEffect(() => {
    if (!themeId) return;

    const fetchTheme = async () => {
      try {
        setLoadingTheme(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/recommendations/themes/${themeId}`
        );

        if (!res.ok) {
          throw new Error(`테마 정보를 불러오지 못했어요. (${res.status})`);
        }

        const data: ThemeDetail = await res.json();
        setTheme(data);

        // 카테고리 중 첫 번째를 기본 선택
        if (data.categories && data.categories.length > 0) {
          setActiveCategory(data.categories[0]);
        }
      } catch (e: any) {
        setError(e.message ?? "테마 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingTheme(false);
      }
    };

    fetchTheme();
  }, [themeId]);

  // 2) 선택된 카테고리 가구 조회
  useEffect(() => {
    if (!themeId || !activeCategory) return;

    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/recommendations/themes/${themeId}/${activeCategory}`
        );

        if (!res.ok) {
          throw new Error(`가구 목록을 불러오지 못했어요. (${res.status})`);
        }

        const data = await res.json();
        // spec: { themeId, category, items: [...] }
        setItems(data.items ?? []);
      } catch (e: any) {
        setError(e.message ?? "가구 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [themeId, activeCategory]);

  if (loadingTheme) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 pt-28 pb-16 px-4">
        <p className="text-sm text-slate-400">스타일 정보를 불러오는 중입니다…</p>
      </main>
    );
  }

  if (!theme || error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 pt-28 pb-16 px-4">
        <p className="text-sm text-red-300">
          {error ?? "스타일 정보를 찾을 수 없습니다."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* 헤더 영역: 스타일 이름 + 설명 */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.25em] text-yellow-500 mb-2">STYLE THEME</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{theme.name}</h1>
            <p className="mt-3 text-sm md:text-base text-slate-600">{theme.description}</p>
          </div>
        </header>

        {/* 카테고리 탭 */}
        {theme.categories && theme.categories.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">카테고리</p>
            <div className="flex flex-wrap gap-2">
              {theme.categories.map((cat) => {
                const isActive = activeCategory === cat;
                const label = CATEGORY_LABEL[cat] ?? cat.replace("_", " ");

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs md:text-sm border transition-all
                      ${
                        isActive
                          ? "bg-yellow-400 text-black border-yellow-400 shadow-sm"
                          : "bg-transparent text-slate-600 border-slate-300 hover:border-yellow-400"
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 아이템 리스트 */}
        <section className="space-y-4">
          {loadingItems && (
            <p className="text-sm text-slate-400">
              가구 정보를 불러오는 중입니다…
            </p>
          )}

          {!loadingItems && items.length === 0 && (
            <p className="text-sm text-slate-400">
              아직 이 카테고리에 등록된 가구가 없어요.
            </p>
          )}

          {!loadingItems && items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => {
                const mainSlug =
                  MAIN_CATEGORY_BY_SUB[item.category] ?? "bed"; // 필요하면 맵핑 조정

                return (
                  <Link
                    key={item.product_id}
                    href={`/category/${mainSlug}/${item.product_id}`}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="w-full h-40 md:h-48 bg-slate-100 overflow-hidden rounded-t-2xl">
                        {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                        ) : (
                        <span className="flex w-full h-full items-center justify-center text-xs text-slate-400">
                            이미지 없음
                        </span>
                        )}
                    </div>

                    <div className="px-4 py-3 space-y-2">
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">
                        {item.name}
                        </p>
                        <p className="text-sm font-semibold text-yellow-700">
                        {formatPrice(item.lowest_price)}원
                        </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
