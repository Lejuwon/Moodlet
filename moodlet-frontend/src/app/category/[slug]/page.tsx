"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type FurnitureItem = {
  product_id: number;
  name: string;
  image_url?: string | null;
  detail_url?: string | null;
  category?: string | null;
  lowest_price?: number | null;
  highest_price?: number | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  bed: "침대",
  sofa: "소파",
  table: "테이블",
  chair: "의자",
  storage: "수납·정리",
  fabric: "패브릭",
  decor: "식물·데코",
};

// 🔹 세부 카테고리 정의 (DB category 값에 맞게 key 수정하면 됨)
const SUBCATEGORY_OPTIONS: Record<string, { key: string; label: string }[]> = {
  bed: [
    { key: "all", label: "전체" },
    { key: "bed_frame", label: "침대 프레임" },
    { key: "mattress", label: "매트리스" },
  ],
  sofa: [
    { key: "all", label: "전체" },
    { key: "fabric_sofa", label: "패브릭 소파" },
    { key: "leather_sofa", label: "가죽 소파" },
  ],
  // chair 등 다른 카테고리도 나중에 여기 추가하면 됨
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function formatPriceRange(low?: number | null, high?: number | null) {
  if (low && high && low !== high) {
    return `${low.toLocaleString()} ~ ${high.toLocaleString()}원`;
  }
  if (low && !high) return `${low.toLocaleString()}원`;
  if (!low && high) return `${high.toLocaleString()}원`;
  return "가격 정보 없음";
}

function formatPrice(price?: number | null) {
  if (price == null) return "-";
  return price.toLocaleString("ko-KR");
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string>("all");

  const subOptions = SUBCATEGORY_OPTIONS[slug] ?? [];

  // ✅ URL 의 ?sub= 값과 selectedSub 동기화
  useEffect(() => {
    if (!slug) return;

    const urlSub = searchParams.get("sub");
    const subKeys = subOptions.map((o) => o.key);

    if (urlSub && subKeys.includes(urlSub)) {
      setSelectedSub(urlSub);
    } else {
      // URL에 이상한 값 / 없을 때 -> 기본값(all)로
      setSelectedSub(subOptions[0]?.key ?? "all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams]); // searchParams가 바뀔 때마다 반응

  // ✅ 선택된 main + sub 로 상품 목록 가져오기
  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("main", slug);

        if (selectedSub && selectedSub !== "all") {
          params.append("sub", selectedSub);
        }

        const res = await fetch(`${API_BASE}/furniture/?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`서버 오류 (${res.status})`);
        }

        const data: FurnitureItem[] = await res.json();
        setItems(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message ?? "가구 정보를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [slug, selectedSub]);

  // 🔹 탭 클릭 시: 상태 + URL 쿼리 둘 다 업데이트
  const handleSelectSub = (key: string) => {
    setSelectedSub(key);

    const current = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      current.delete("sub");
    } else {
      current.set("sub", key);
    }

    const qs = current.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;

    router.replace(href, { scroll: false });
  };

  const label = CATEGORY_LABEL[slug] ?? slug;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* 상단 타이틀 */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              {label} 카테고리 가구
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              무드렛이 모아 온 {label} 관련 가구 리스트예요.
            </p>
          </div>
        </div>

        {/* 🔹 세부 카테고리 탭 */}
        {subOptions.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-none">
            {subOptions.map((opt) => {
              const isActive = selectedSub === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectSub(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition-all
                    ${
                      isActive
                        ? "bg-yellow-400 text-black border-yellow-400 shadow-sm"
                        : "bg-white text-slate-600 border-slate-300 hover:border-yellow-400"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 상태 표시 */}
        {loading && (
          <p className="text-sm text-gray-400">가구 정보를 불러오는 중입니다…</p>
        )}

        {error && <p className="text-sm text-red-400">오류: {error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-gray-400">
            아직 이 세부 카테고리에 등록된 가구가 없어요.
          </p>
        )}

        {/* 상품 카드 그리드 (이케아 느낌) */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const lowest =
                item.lowest_price ??
                item.highest_price ??
                null; // 둘 다 없으면 null

              return (
                <Link
                  key={item.product_id}
                  href={`/category/${slug}/${item.product_id}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <article
                    className="
                      transition-all duration-200
                    "
                  >
                    {/* 이미지 영역 – 흰 배경 위에 제품만 딱 보이게 */}
                    <div className="w-full h-40 md:h-48 bg-slate-100 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-slate-400">
                          이미지 없음
                        </div>
                      )}
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="px-4 py-3 space-y-2">
                      {/* 상품명 */}
                      <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
                        {item.name}
                      </h3>

                      {/* 가격 – 노란 박스로 최저가 강조 */}
                      <div className="mt-3">
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {lowest ? `${formatPrice(lowest)}원` : "-"}
                        </p>

                        {/* 범위 정보가 있을 때만 한 줄 더 표시 */}
                        {item.lowest_price &&
                          item.highest_price &&
                          item.lowest_price !== item.highest_price && (
                            <p className="mt-1 text-[11px] text-gray-500">
                              {formatPrice(item.lowest_price)} ~{" "}
                              {formatPrice(item.highest_price)}원
                            </p>
                          )}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}